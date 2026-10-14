import "server-only";
import { headers } from "next/headers";

// in-memory limiter; fine for a single render instance
const buckets = new Map<string, number[]>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${await clientIp()}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
