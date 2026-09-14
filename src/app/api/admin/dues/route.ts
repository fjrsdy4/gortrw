// Vercel Serverless Function: /api/admin/dues — Ceklis iuran (otomatis ke arus kas)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dueTypes, duePayments, transactions, citizens, activityLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, generateTxId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await db.select().from(dueTypes);
  const activeCitizens = await db.select({ id: citizens.id, name: citizens.name })
    .from(citizens).where(eq(citizens.status, "aktif")).orderBy(citizens.name);
  const payments = await db.select().from(duePayments).orderBy(desc(duePayments.id));
  return NextResponse.json({ types, citizens: activeCitizens, payments });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { citizenId, dueTypeId, month, year, action, proofUrl } = body;

  const [dt] = await db.select().from(dueTypes).where(eq(dueTypes.id, dueTypeId)).limit(1);
  if (!dt) return NextResponse.json({ error: "Jenis iuran tidak ditemukan" }, { status: 404 });
  const [cit] = await db.select({ name: citizens.name }).from(citizens).where(eq(citizens.id, citizenId)).limit(1);

  const existing = await db.select().from(duePayments)
    .where(and(eq(duePayments.citizenId, citizenId), eq(duePayments.dueTypeId, dueTypeId),
      eq(duePayments.month, month), eq(duePayments.year, year))).limit(1);

  // action "unpay" -> batalkan ceklis + hapus transaksi terkait
  if (action === "unpay") {
    if (existing.length > 0) {
      const p = existing[0];
      if (p.transactionId) {
        const [tx] = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.id, p.transactionId)).limit(1);
        if (tx) await db.delete(transactions).where(eq(transactions.id, tx.id));
      }
      await db.delete(duePayments).where(eq(duePayments.id, p.id));
      await db.insert(activityLogs).values({ userId: user.id, action: "Batalkan Iuran", detail: `${cit?.name} - ${dt.name} ${month}/${year}` });
    }
    return NextResponse.json({ success: true, action: "unpaid" });
  }

  if (existing.length > 0 && existing[0].paid) return NextResponse.json({ success: true, already: true });

  const today = new Date().toISOString().split("T")[0];
  const txId = generateTxId();
  const [tx] = await db.insert(transactions).values({
    txId, txType: "masuk", category: dt.name,
    description: `${dt.name} ${cit?.name || ""} - ${month}/${year}`,
    amount: dt.amount, txDate: today, proofUrl: proofUrl || null, createdBy: user.id,
  }).returning();

  if (existing.length > 0) {
    await db.update(duePayments).set({ paid: true, paidDate: today, transactionId: tx.id, proofUrl: proofUrl || null })
      .where(eq(duePayments.id, existing[0].id));
  } else {
    await db.insert(duePayments).values({
      citizenId, dueTypeId, month, year, paid: true, paidDate: today,
      transactionId: tx.id, proofUrl: proofUrl || null,
    });
  }
  await db.insert(activityLogs).values({ userId: user.id, action: "Bayar Iuran", detail: `${cit?.name} - ${dt.name} ${month}/${year} (${txId})` });
  return NextResponse.json({ success: true, txId });
}

// Tambah jenis iuran
export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const [created] = await db.insert(dueTypes).values({ name: body.name, amount: body.amount }).returning();
  return NextResponse.json(created);
}
