import { NextRequest, NextResponse } from "next/server";
import { startWebRTCSession } from "@/lib/vaani/client";
import { z } from "zod";

const BodySchema = z.object({
  agentId: z.string().uuid("agentId must be a valid UUID"),
  primaryLanguage: z.string().optional(),
  welcomeMessage: z.string().optional(),
  voiceGender: z.enum(["male", "female"]).optional(),
  voiceSpeed: z.number().min(0.6).max(1.4).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { agentId, ...opts } = parsed.data;
  const result = await startWebRTCSession(agentId, opts);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }

  // Never forward the raw token in a way that exposes it unnecessarily.
  // We return it here because the client needs it to connect to LiveKit.
  // The connection_url and live_captions_url are also needed client-side.
  return NextResponse.json(result.data);
}
