// Vercel Serverless Function: /api/admin/events — Agenda, notulen & absensi
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, attendance } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(events).orderBy(desc(events.eventDate)));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [created] = await db.insert(events).values({
    title: body.title, description: body.description || null, eventDate: body.eventDate,
    eventTime: body.eventTime || null, location: body.location || null,
    minutesUrl: body.minutesUrl || null, createdBy: user.id,
  }).returning();
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(events).set({
    minutesUrl: body.minutesUrl ?? undefined, description: body.description ?? undefined,
  }).where(eq(events.id, body.id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(attendance).where(eq(attendance.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ success: true });
}
