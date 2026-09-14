// Vercel Serverless Function: POST /api/seed
// Membuat seluruh tabel (idempotent) lalu mengisi data demo bila kosong.
import { NextResponse } from "next/server";
import { ensureDatabase } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureDatabase();
    return NextResponse.json({ message: "OK" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
