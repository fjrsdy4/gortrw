// Vercel Serverless Function: /api/admin/umkm — Produk UMKM warga
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { umkmProducts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(umkmProducts).orderBy(desc(umkmProducts.createdAt)));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [created] = await db.insert(umkmProducts).values({
    citizenId: body.citizenId || null, productName: body.productName, description: body.description || null,
    price: body.price || null, photoUrl: body.photoUrl || null, whatsapp: body.whatsapp || null,
    isActive: body.isActive ?? true,
  }).returning();
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(umkmProducts).set({
    productName: body.productName, description: body.description || null, price: body.price || null,
    photoUrl: body.photoUrl || null, whatsapp: body.whatsapp || null, isActive: body.isActive ?? true,
  }).where(eq(umkmProducts.id, body.id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(umkmProducts).where(eq(umkmProducts.id, id));
  return NextResponse.json({ success: true });
}
