import { requireUser } from "@/lib/supabase-server";
import { authUrl } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  return NextResponse.redirect(authUrl(gate.userId));
}
