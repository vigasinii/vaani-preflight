import { NextResponse } from "next/server";
import { listAgents } from "@/lib/vaani/client";

export async function GET() {
  const result = await listAgents();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }
  return NextResponse.json(result.data);
}
