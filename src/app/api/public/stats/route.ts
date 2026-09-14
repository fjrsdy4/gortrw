// Vercel Serverless Function: GET /api/auth/me
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDatabase } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const user = await getSession();
    return NextResponse.json({ user: user || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
