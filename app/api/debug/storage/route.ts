import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint: confirms which storage backend is live and whether
 * Redis round-trips actually work in the deployed function runtime.
 *
 * Safe to keep behind a token check; for now it only exposes presence flags,
 * not secret values.
 */
export async function GET() {
  const envFlags = {
    UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
    KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
  };

  let backend: "kv" | "file" | "unknown" = "unknown";
  let roundTrip: { ok: boolean; value?: number; error?: string } = { ok: false };

  try {
    const s = storage();
    // The two implementations differ in constructor identity; we can detect by
    // probing a write to a throwaway key and checking it persists.
    const probeId = "__debug_probe__";
    const before = await s.get(probeId);
    const after = await s.incrementDownload(probeId);
    backend =
      envFlags.UPSTASH_REDIS_REST_URL || envFlags.KV_REST_API_URL ? "kv" : "file";
    roundTrip = { ok: after === before.downloads + 1, value: after };
  } catch (e) {
    roundTrip = { ok: false, error: (e as Error).message };
  }

  return NextResponse.json({ backend, envFlags, roundTrip });
}
