// Vercel Serverless Function: POST /api/auth/login
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    response.cookies.set("session", JSON.stringify({ userId: user.id }), {
      httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax",
    });
    await db.insert(activityLogs).values({ userId: user.id, action: "Login", detail: `${user.name} (${user.role}) login` });
    return response;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
