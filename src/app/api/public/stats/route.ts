// Vercel Serverless Function: GET /api/public/stats
// Data transparansi untuk landing page publik (tanpa autentikasi)
import { NextResponse } from "next/server";
import { db } from "@/db";
import { citizens, announcements, events, transactions, assets, umkmProducts } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { ensureDatabase } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auto-bootstrap agar landing page langsung tampil di Vercel tanpa setup manual.
    await ensureDatabase();
    const [citizenCount] = await db.select({ count: sql<number>`count(*)::int` }).from(citizens).where(eq(citizens.status, "aktif"));
    const [familyCount] = await db.select({ count: sql<number>`count(distinct ${citizens.familyId})` })
      .from(citizens).where(and(eq(citizens.status, "aktif"), sql`${citizens.familyId} is not null`));

    const genderStats = await db.select({ gender: citizens.gender, count: sql<number>`count(*)::int` })
      .from(citizens).where(eq(citizens.status, "aktif")).groupBy(citizens.gender);
    const religionStats = await db.select({ religion: citizens.religion, count: sql<number>`count(*)::int` })
      .from(citizens).where(eq(citizens.status, "aktif")).groupBy(citizens.religion);
    const maritalStats = await db.select({ status: citizens.maritalStatus, count: sql<number>`count(*)::int` })
      .from(citizens).where(eq(citizens.status, "aktif")).groupBy(citizens.maritalStatus);

    const ageStats = await db.execute(sql`
      SELECT CASE
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 5 THEN 'Balita (0-4)'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 12 THEN 'Anak (5-11)'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 18 THEN 'Remaja (12-17)'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 26 THEN 'Pemuda (18-25)'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 46 THEN 'Dewasa (26-45)'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date::date)) < 60 THEN 'Paruh Baya (46-59)'
          ELSE 'Lansia (60+)' END as age_group,
        count(*)::int as count
      FROM citizens WHERE status='aktif' AND birth_date IS NOT NULL
      GROUP BY age_group`);

    const latestAnnouncements = await db.select().from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt)).limit(5);
    const upcomingEvents = await db.select().from(events)
      .where(sql`${events.eventDate} >= CURRENT_DATE`).orderBy(events.eventDate).limit(6);

    const [income] = await db.select({ total: sql<string>`COALESCE(SUM(amount::numeric),0)::text` }).from(transactions).where(eq(transactions.txType, "masuk"));
    const [expense] = await db.select({ total: sql<string>`COALESCE(SUM(amount::numeric),0)::text` }).from(transactions).where(eq(transactions.txType, "keluar"));
    const recentExpenses = await db.select().from(transactions).where(eq(transactions.txType, "keluar")).orderBy(desc(transactions.txDate)).limit(5);

    const [assetCount] = await db.select({ count: sql<number>`count(*)::int` }).from(assets);
    const products = await db.select().from(umkmProducts).where(eq(umkmProducts.isActive, true)).orderBy(desc(umkmProducts.createdAt)).limit(8);

    return NextResponse.json({
      citizenCount: citizenCount.count,
      familyCount: familyCount.count,
      genderStats, religionStats, maritalStats,
      ageStats: ageStats.rows,
      announcements: latestAnnouncements,
      events: upcomingEvents,
      income: income.total, expense: expense.total,
      balance: String(parseFloat(income.total) - parseFloat(expense.total)),
      recentExpenses, assetCount: assetCount.count, products,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
