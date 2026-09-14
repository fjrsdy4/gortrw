// Vercel Serverless Function: /api/admin/attendance — Absensi rapat/kegiatan
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, citizens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const eventId = Number(new URL(req.url).searchParams.get("eventId"));
  const allCitizens = await db
    .select({ id: citizens.id, name: citizens.name, address: citizens.address, rt: citizens.rt, rw: citizens.rw })
    .from(citizens).where(eq(citizens.status, "aktif")).orderBy(citizens.name);
  const rows = await db.select().from(attendance).where(eq(attendance.eventId, eventId));
  const presentMap = new Map(rows.map((r) => [r.citizenId, r.present]));
  return NextResponse.json(allCitizens.map((c) => ({ ...c, present: presentMap.get(c.id) || false })));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json(); // { eventId, citizenId, present }
  const existing = await db.select().from(attendance)
    .where(and(eq(attendance.eventId, body.eventId), eq(attendance.citizenId, body.citizenId))).limit(1);
  if (existing.length > 0) {
    await db.update(attendance).set({ present: body.present }).where(eq(attendance.id, existing[0].id));
  } else {
    await db.insert(attendance).values({ eventId: body.eventId, citizenId: body.citizenId, present: body.present });
  }
  return NextResponse.json({ success: true });
}
