import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session");
  if (!sessionData?.value) return null;
  try {
    const parsed = JSON.parse(sessionData.value);
    if (!parsed.userId) return null;
    const [user] = await db
      .select({ id: users.id, username: users.username, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.userId))
      .limit(1);
    return user || null;
  } catch {
    return null;
  }
}

export function generateTicket(prefix: string): string {
  const d = new Date();
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function generateTxId(): string {
  const d = new Date();
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRX-${ts}-${rand}`;
}

export function classifyAge(birthDate: string): string {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 5) return "Balita (0-4)";
  if (age < 12) return "Anak (5-11)";
  if (age < 18) return "Remaja (12-17)";
  if (age < 26) return "Pemuda (18-25)";
  if (age < 46) return "Dewasa (26-45)";
  if (age < 60) return "Paruh Baya (46-59)";
  return "Lansia (60+)";
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
