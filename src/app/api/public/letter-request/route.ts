// Vercel Serverless Function: POST /api/public/letter-request
// Layanan mandiri warga — tanpa login, menghasilkan nomor tiket instan
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { letterRequests, notifications } from "@/db/schema";
import { generateTicket } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.requesterName || !body.letterType) {
      return NextResponse.json({ error: "Nama dan jenis surat wajib diisi" }, { status: 400 });
    }
    const ticketNo = generateTicket("SRT");
    await db.insert(letterRequests).values({
      ticketNo, requesterName: body.requesterName, requesterPhone: body.requesterPhone || null,
      letterType: body.letterType, purpose: body.purpose || null,
    });
    await db.insert(notifications).values({
      title: "Permohonan Surat Baru",
      message: `${body.requesterName} mengajukan ${body.letterType} (${ticketNo})`, type: "letter",
    });
    return NextResponse.json({ success: true, ticketNo });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
