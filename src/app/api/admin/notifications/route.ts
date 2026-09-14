// Vercel Serverless Function: /api/admin/notifications — Lonceng notifikasi realtime
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20);
  const [unreadCount] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(eq(notifications.isRead, false));
  return NextResponse.json({ notifications: result, unreadCount: unreadCount.count });
}

export async function PUT() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  return NextResponse.json({ success: true });
}
