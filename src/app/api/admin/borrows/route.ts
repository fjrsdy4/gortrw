// Vercel Serverless Function: /api/admin/borrows — Kelola peminjaman aset
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assetBorrows, assets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await db.select({
    id: assetBorrows.id, ticketNo: assetBorrows.ticketNo, assetId: assetBorrows.assetId,
    assetName: assets.name, borrowerName: assetBorrows.borrowerName, borrowerPhone: assetBorrows.borrowerPhone,
    borrowDate: assetBorrows.borrowDate, returnDate: assetBorrows.returnDate,
    actualReturnDate: assetBorrows.actualReturnDate, status: assetBorrows.status,
    purpose: assetBorrows.purpose, createdAt: assetBorrows.createdAt,
  }).from(assetBorrows).leftJoin(assets, eq(assetBorrows.assetId, assets.id)).orderBy(desc(assetBorrows.createdAt));
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [updated] = await db.update(assetBorrows).set({
    status: body.status, actualReturnDate: body.actualReturnDate || null,
  }).where(eq(assetBorrows.id, body.id)).returning();
  return NextResponse.json(updated);
}
