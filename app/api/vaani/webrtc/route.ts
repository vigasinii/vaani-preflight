import { NextRequest, NextResponse } from "next/server";
import { startWebRTCSession } from "@/lib/vaani/client";
import { isAuthenticated } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { z } from "zod";

const BodySchema = z.object({
  agentId: z.string().uuid("agentId must be a valid UUID"),
  primaryLanguage: z.string().optional(),
  welcomeMessage: z.string().max(500).optional(),
  voiceGender: z.enum(["male", "female"]).optional(),
  voiceSpeed: z.number().min(0.6).max(1.4).optional(),
});

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // 5 sessions per 10 minutes per IP — prevents runaway billing
  if (!rateLimit(`webrtc:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait before starting another session." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { agentId, ...opts } = parsed.data;
  const result = await startWebRTCSession(agentId, opts);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }

  // Return only what the client needs. Token is short-lived and room-scoped.
  const { token, room_name, connection_url, live_captions_url, agent_name } = result.data;
  return NextResponse.json({ token, room_name, connection_url, live_captions_url, agent_name });
}
