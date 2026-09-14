// Vercel Serverless Function: POST /api/public/borrow
// Peminjaman aset publik oleh warga tanpa login
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assetBorrows, notifications, assets } from "@/db/schema";
import { generateTicket } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.borrowerName || !body.assetId || !body.borrowDate) {
      return NextResponse.json({ error: "Nama, aset, dan tanggal pinjam wajib diisi" }, { status: 400 });
    }
    const ticketNo = generateTicket("PJM");
    const [asset] = await db.select({ name: assets.name }).from(assets).where(eq(assets.id, body.assetId)).limit(1);
    await db.insert(assetBorrows).values({
      ticketNo, assetId: body.assetId, borrowerName: body.borrowerName,
      borrowerPhone: body.borrowerPhone || null, borrowDate: body.borrowDate,
      returnDate: body.returnDate || null, purpose: body.purpose || null,
    });
    await db.insert(notifications).values({
      title: "Peminjaman Aset Baru",
      message: `${body.borrowerName} meminjam ${asset?.name || "aset"} (${ticketNo})`, type: "borrow",
    });
    return NextResponse.json({ success: true, ticketNo });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
