// Vercel Serverless Function: POST /api/public/complaint
// Pengaduan warga — mendukung mode anonim
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complaints, notifications } from "@/db/schema";
import { generateTicket } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.content) return NextResponse.json({ error: "Isi pengaduan wajib diisi" }, { status: 400 });
    const ticketNo = generateTicket("ADU");
    const isAnonymous = !!body.isAnonymous;
    await db.insert(complaints).values({
      ticketNo, reporterName: isAnonymous ? null : body.reporterName || null,
      isAnonymous, category: body.category || null, content: body.content,
    });
    await db.insert(notifications).values({
      title: "Pengaduan Baru",
      message: `${isAnonymous ? "Anonim" : body.reporterName} mengirim pengaduan (${ticketNo})`, type: "complaint",
    });
    return NextResponse.json({ success: true, ticketNo });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
