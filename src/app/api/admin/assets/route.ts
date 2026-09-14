// Vercel Serverless Function: /api/admin/assets — Inventaris dengan foto
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(assets).orderBy(desc(assets.createdAt)));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [created] = await db.insert(assets).values({
    name: body.name, description: body.description || null, quantity: body.quantity || 1,
    condition: body.condition || "Baik", location: body.location || null,
    photoUrl: body.photoUrl || null, isBorrowable: body.isBorrowable ?? true,
  }).returning();
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(assets).set({
    name: body.name, description: body.description || null, quantity: body.quantity || 1,
    condition: body.condition || "Baik", location: body.location || null,
    photoUrl: body.photoUrl || null, isBorrowable: body.isBorrowable ?? true,
  }).where(eq(assets.id, body.id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(assets).where(eq(assets.id, id));
  return NextResponse.json({ success: true });
}
