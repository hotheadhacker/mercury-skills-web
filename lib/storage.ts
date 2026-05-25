/**
 * Storage abstraction for like/download counts.
 *
 * In production this is backed by Vercel KV (Upstash Redis).
 * In local development, when KV env vars are missing, falls back to a JSON file
 * at data/stats.local.json so the app remains fully functional without setup.
 *
 * The interface is intentionally narrow so we can swap to MongoDB later
 * without touching callsites.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export interface SkillStats {
  likes: number;
  downloads: number;
}

export interface StatsStorage {
  get(id: string): Promise<SkillStats>;
  getMany(ids: string[]): Promise<Record<string, SkillStats>>;
  incrementLike(id: string): Promise<number>;
  incrementDownload(id: string): Promise<number>;
  topByLikes(limit: number): Promise<{ id: string; likes: number }[]>;
  topByDownloads(limit: number): Promise<{ id: string; downloads: number }[]>;
}

// ----- File-backed implementation (dev fallback) -----

const FILE_PATH = join(process.cwd(), "data", "stats.local.json");

interface FileShape {
  likes: Record<string, number>;
  downloads: Record<string, number>;
}

function readFile(): FileShape {
  if (!existsSync(FILE_PATH)) return { likes: {}, downloads: {} };
  try {
    return JSON.parse(readFileSync(FILE_PATH, "utf8")) as FileShape;
  } catch {
    return { likes: {}, downloads: {} };
  }
}

function writeFile(data: FileShape) {
  mkdirSync(dirname(FILE_PATH), { recursive: true });
  writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

const fileStorage: StatsStorage = {
  async get(id) {
    const d = readFile();
    return { likes: d.likes[id] ?? 0, downloads: d.downloads[id] ?? 0 };
  },
  async getMany(ids) {
    const d = readFile();
    const out: Record<string, SkillStats> = {};
    for (const id of ids) {
      out[id] = { likes: d.likes[id] ?? 0, downloads: d.downloads[id] ?? 0 };
    }
    return out;
  },
  async incrementLike(id) {
    const d = readFile();
    d.likes[id] = (d.likes[id] ?? 0) + 1;
    writeFile(d);
    return d.likes[id];
  },
  async incrementDownload(id) {
    const d = readFile();
    d.downloads[id] = (d.downloads[id] ?? 0) + 1;
    writeFile(d);
    return d.downloads[id];
  },
  async topByLikes(limit) {
    const d = readFile();
    return Object.entries(d.likes)
      .map(([id, likes]) => ({ id, likes }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  },
  async topByDownloads(limit) {
    const d = readFile();
    return Object.entries(d.downloads)
      .map(([id, downloads]) => ({ id, downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  },
};

// ----- Vercel KV implementation -----

function makeKvStorage(): StatsStorage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  const redis = Redis.fromEnv();
  const likesKey = (id: string) => `skill:likes:${id}`;
  const downloadsKey = (id: string) => `skill:downloads:${id}`;
  const LIKES_ZSET = "skills:likes:zset";
  const DOWNLOADS_ZSET = "skills:downloads:zset";

  return {
    async get(id) {
      const [likes, downloads] = await Promise.all([
        redis.get<number>(likesKey(id)),
        redis.get<number>(downloadsKey(id)),
      ]);
      return { likes: likes ?? 0, downloads: downloads ?? 0 };
    },
    async getMany(ids) {
      if (ids.length === 0) return {};
      const keys = ids.flatMap((id) => [likesKey(id), downloadsKey(id)]);
      const vals = (await redis.mget(...keys)) as (number | null)[];
      const out: Record<string, SkillStats> = {};
      ids.forEach((id, i) => {
        out[id] = {
          likes: vals[i * 2] ?? 0,
          downloads: vals[i * 2 + 1] ?? 0,
        };
      });
      return out;
    },
    async incrementLike(id) {
      const v = await redis.incr(likesKey(id));
      await redis.zadd(LIKES_ZSET, { score: v, member: id });
      return v;
    },
    async incrementDownload(id) {
      const v = await redis.incr(downloadsKey(id));
      await redis.zadd(DOWNLOADS_ZSET, { score: v, member: id });
      return v;
    },
    async topByLikes(limit) {
      const res = (await redis.zrange(LIKES_ZSET, 0, limit - 1, {
        rev: true,
        withScores: true,
      })) as (string | number)[];
      const out: { id: string; likes: number }[] = [];
      for (let i = 0; i < res.length; i += 2) {
        out.push({ id: String(res[i]), likes: Number(res[i + 1]) });
      }
      return out;
    },
    async topByDownloads(limit) {
      const res = (await redis.zrange(DOWNLOADS_ZSET, 0, limit - 1, {
        rev: true,
        withScores: true,
      })) as (string | number)[];
      const out: { id: string; downloads: number }[] = [];
      for (let i = 0; i < res.length; i += 2) {
        out.push({ id: String(res[i]), downloads: Number(res[i + 1]) });
      }
      return out;
    },
  };
}

let _storage: StatsStorage | null = null;
export function storage(): StatsStorage {
  if (_storage) return _storage;
  const hasUpstash =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (hasUpstash) {
    try {
      // @upstash/redis' fromEnv() looks for UPSTASH_REDIS_REST_URL/TOKEN by default;
      // mirror Vercel's KV_* into them if only the legacy vars are present.
      if (!process.env.UPSTASH_REDIS_REST_URL && process.env.KV_REST_API_URL) {
        process.env.UPSTASH_REDIS_REST_URL = process.env.KV_REST_API_URL;
      }
      if (!process.env.UPSTASH_REDIS_REST_TOKEN && process.env.KV_REST_API_TOKEN) {
        process.env.UPSTASH_REDIS_REST_TOKEN = process.env.KV_REST_API_TOKEN;
      }
      _storage = makeKvStorage();
      return _storage;
    } catch (e) {
      console.warn("[storage] falling back to file storage:", (e as Error).message);
    }
  }
  _storage = fileStorage;
  return _storage;
}
