import { NextRequest } from "next/server";

export const SESSION_COOKIE = "vp_session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 8, // 8 hours
};

export function isAuthenticated(req: NextRequest): boolean {
  const secret = process.env.OWNER_SECRET;
  if (!secret) return false;
  const cookie = req.cookies.get(SESSION_COOKIE);
  return cookie?.value === secret;
}

export function cookieOptions() {
  return COOKIE_OPTS;
}
