// Vercel Serverless Function: /api/admin/transactions — Arus kas
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, generateTxId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(transactions).orderBy(desc(transactions.txDate), desc(transactions.createdAt)));
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden - hanya admin/bendahara" }, { status: 403 });

  const body = await req.json();
  const txId = generateTxId();
  const [created] = await db.insert(transactions).values({
    txId, txType: body.txType, category: body.category, description: body.description || null,
    amount: body.amount, txDate: body.txDate, proofUrl: body.proofUrl || null, createdBy: user.id,
  }).returning();
  await db.insert(activityLogs).values({
    userId: user.id, action: `Transaksi ${body.txType}`, detail: `${txId}: ${body.category} - Rp ${body.amount}`,
  });
  return NextResponse.json(created);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(transactions).where(eq(transactions.id, id));
  return NextResponse.json({ success: true });
}
