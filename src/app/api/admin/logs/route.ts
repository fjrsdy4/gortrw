// Vercel Serverless Function: /api/admin/logs — Audit trail (khusus admin)
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden - khusus admin" }, { status: 403 });

  const result = await db.select({
    id: activityLogs.id, action: activityLogs.action, detail: activityLogs.detail,
    createdAt: activityLogs.createdAt, userName: users.name, userRole: users.role,
  }).from(activityLogs).leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt)).limit(100);
  return NextResponse.json(result);
}
