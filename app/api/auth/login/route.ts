import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 5 attempts per 15 minutes per IP
  if (!rateLimit(`login:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const secret = process.env.OWNER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Owner access is not configured on this deployment." }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" || body === null ||
    !("secret" in body) || typeof (body as Record<string, unknown>).secret !== "string"
  ) {
    return NextResponse.json({ error: "Missing secret." }, { status: 400 });
  }

  const provided = (body as { secret: string }).secret;

  // Constant-time comparison to prevent timing attacks
  const encoder = new TextEncoder();
  const a = encoder.encode(provided.padEnd(secret.length));
  const b = encoder.encode(secret.padEnd(provided.length));
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i];

  if (diff !== 0) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, secret, cookieOptions());
  return res;
}
