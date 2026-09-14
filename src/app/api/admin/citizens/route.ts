// Vercel Serverless Function: /api/admin/citizens — CRUD data warga
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citizens, families, activityLogs } from "@/db/schema";
import { eq, sql, and, ilike, or, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "aktif";
  const search = url.searchParams.get("search") || "";

  const conditions = [eq(citizens.status, status as "aktif" | "pindah" | "meninggal")];
  if (search) {
    conditions.push(or(
      ilike(citizens.name, `%${search}%`),
      ilike(citizens.nik, `%${search}%`),
      ilike(citizens.phone, `%${search}%`)
    )!);
  }

  const result = await db.select({
    id: citizens.id, nik: citizens.nik, name: citizens.name, gender: citizens.gender,
    birthPlace: citizens.birthPlace, birthDate: citizens.birthDate, religion: citizens.religion,
    maritalStatus: citizens.maritalStatus, occupation: citizens.occupation, phone: citizens.phone,
    address: citizens.address, rt: citizens.rt, rw: citizens.rw, familyId: citizens.familyId,
    familyRelation: citizens.familyRelation, status: citizens.status, statusDate: citizens.statusDate,
    statusNote: citizens.statusNote, familyNoKK: families.noKK, familyHeadName: families.headName,
  }).from(citizens).leftJoin(families, eq(citizens.familyId, families.id))
    .where(and(...conditions)).orderBy(desc(citizens.createdAt));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "bendahara") return NextResponse.json({ error: "Forbidden - role staff/bendahara terbatas" }, { status: 403 });

  try {
    const body = await req.json();
    const [created] = await db.insert(citizens).values({
      nik: body.nik, name: body.name, gender: body.gender, birthPlace: body.birthPlace || null,
      birthDate: body.birthDate || null, religion: body.religion || null, maritalStatus: body.maritalStatus || null,
      occupation: body.occupation || null, phone: body.phone || null, address: body.address || null,
      rt: body.rt || null, rw: body.rw || null, familyId: body.familyId || null,
      familyRelation: body.familyRelation || null,
    }).returning();
    await db.insert(activityLogs).values({ userId: user.id, action: "Tambah Warga", detail: `${body.name} (${body.nik})` });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "bendahara") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const [updated] = await db.update(citizens).set({
      nik: body.nik, name: body.name, gender: body.gender, birthPlace: body.birthPlace || null,
      birthDate: body.birthDate || null, religion: body.religion || null, maritalStatus: body.maritalStatus || null,
      occupation: body.occupation || null, phone: body.phone || null, address: body.address || null,
      rt: body.rt || null, rw: body.rw || null, familyId: body.familyId || null,
      familyRelation: body.familyRelation || null, status: body.status || "aktif",
      statusDate: body.statusDate || null, statusNote: body.statusNote || null,
    }).where(eq(citizens.id, body.id)).returning();
    await db.insert(activityLogs).values({ userId: user.id, action: "Edit/Status Warga", detail: `${body.name} (${body.nik})` });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
