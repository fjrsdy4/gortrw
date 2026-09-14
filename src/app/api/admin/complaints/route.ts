// Vercel Serverless Function: /api/admin/complaints — Kelola pengaduan
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(complaints).orderBy(desc(complaints.createdAt)));
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(complaints).set({
    status: body.status, response: body.response || null,
  }).where(eq(complaints.id, body.id)).returning();
  return NextResponse.json(updated);
}
