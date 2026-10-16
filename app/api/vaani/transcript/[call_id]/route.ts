import { NextRequest, NextResponse } from "next/server";
import { getTranscript } from "@/lib/vaani/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ call_id: string }> }
) {
  const { call_id } = await params;
  if (!call_id || typeof call_id !== "string") {
    return NextResponse.json({ error: "call_id is required" }, { status: 400 });
  }

  const result = await getTranscript(call_id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }
  return NextResponse.json(result.data);
}
