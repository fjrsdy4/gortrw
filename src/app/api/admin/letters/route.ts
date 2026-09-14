// Vercel Serverless Function: /api/admin/letters — Kelola permohonan surat
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { letterRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(letterRequests).orderBy(desc(letterRequests.createdAt)));
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(letterRequests).set({
    status: body.status, notes: body.notes || null,
  }).where(eq(letterRequests.id, body.id)).returning();
  return NextResponse.json(updated);
}
