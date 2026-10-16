// Simple in-memory rate limiter - sufficient for a portfolio deployment.
// Resets on server restart; does not persist across Vercel edge instances.

interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (bucket.count >= maxRequests) return false; // blocked
  bucket.count++;
  return true;
}

export function clientIp(req: import("next/server").NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
