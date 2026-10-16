import { NextRequest, NextResponse } from "next/server";
import { getTranscript } from "@/lib/vaani/client";
import { isAuthenticated } from "@/lib/auth";

// room_name format from Vaani: alphanumeric + hyphens, up to 100 chars
const CALL_ID_RE = /^[a-zA-Z0-9_\-]{1,100}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ call_id: string }> }
) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { call_id } = await params;

  if (!call_id || !CALL_ID_RE.test(call_id)) {
    return NextResponse.json({ error: "Invalid call_id format." }, { status: 400 });
  }

  const result = await getTranscript(call_id);
  if (!result.ok) {
    if (result.status === 404) {
      return NextResponse.json({ available: false, reason: "Transcript not yet available." }, { status: 200 });
    }
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }

  return NextResponse.json({ available: true, ...result.data });
}
