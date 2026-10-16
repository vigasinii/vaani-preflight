import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/vaani/client";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const result = await checkAuth();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status || 500 });
  }
  return NextResponse.json(result.data);
}
