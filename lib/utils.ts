import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact-format an integer count so it fits inside narrow pill UI without
 * overflowing. Keeps one decimal of precision when below the next round
 * threshold (e.g. 1.2k, 3.4m), drops it otherwise (12k, 250m). Always
 * lowercase suffix to match the rest of the interface's mono accents.
 *
 *   999     -> "999"
 *   1000    -> "1k"
 *   1234    -> "1.2k"
 *   12_345  -> "12k"
 *   1.2e6   -> "1.2m"
 *   1.2e9   -> "1.2b"
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs < 1_000) return sign + Math.trunc(abs);

  const tiers: { limit: number; div: number; suffix: string }[] = [
    { limit: 1_000_000, div: 1_000, suffix: "k" },
    { limit: 1_000_000_000, div: 1_000_000, suffix: "m" },
    { limit: 1_000_000_000_000, div: 1_000_000_000, suffix: "b" },
    { limit: Number.POSITIVE_INFINITY, div: 1_000_000_000_000, suffix: "t" },
  ];

  for (let i = 0; i < tiers.length; i++) {
    const { limit, div, suffix } = tiers[i];
    if (abs >= limit) continue;
    const v = abs / div;
    // 1.0 -> "1", 1.2 -> "1.2", but only keep the decimal under 10 so we don't
    // burn pixels on "12.3k" where "12k" is just as informative.
    let s = v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v));
    // Guard against rounding-up across the tier boundary: 999_999 / 1000 =
    // 999.999, which Math.round() turns into 1000 - render "1m" not "1000k".
    if (Number(s) >= 1000 && i + 1 < tiers.length) {
      const next = tiers[i + 1];
      const nv = abs / next.div;
      s = nv < 10 ? nv.toFixed(1).replace(/\.0$/, "") : String(Math.round(nv));
      return sign + s + next.suffix;
    }
    return sign + s + suffix;
  }
  return sign + String(abs);
}
