// Vercel Serverless Function: GET /api/public/assets-list
import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.select({ id: assets.id, name: assets.name, quantity: assets.quantity })
      .from(assets).where(eq(assets.isBorrowable, true));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
