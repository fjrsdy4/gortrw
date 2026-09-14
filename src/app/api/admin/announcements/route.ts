// Vercel Serverless Function: /api/admin/announcements — Pengumuman
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(announcements).orderBy(desc(announcements.createdAt)));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [created] = await db.insert(announcements).values({
    title: body.title, content: body.content, isPinned: body.isPinned || false, createdBy: user.id,
  }).returning();
  return NextResponse.json(created);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(announcements).where(eq(announcements.id, id));
  return NextResponse.json({ success: true });
}
