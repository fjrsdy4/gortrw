"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, LayoutDashboard, Users, Home, FolderOpen, Wallet, CreditCard, Package,
  FileText, MessageSquareWarning, Handshake, Megaphone, CalendarDays, ShoppingBag,
  Smartphone, Shield, LogOut, Menu, Bell, Globe, type LucideIcon,
} from "lucide-react";

interface User { id: number; name: string; role: string; username: string }
interface Notif { id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string }

const MENU: { href: string; label: string; icon: LucideIcon; roles: string[] }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff", "bendahara"] },
  { href: "/admin/dashboard/citizens", label: "Data Warga", icon: Users, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/families", label: "Data KK", icon: Home, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/citizens-inactive", label: "Pindah/Meninggal", icon: FolderOpen, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/finance", label: "Keuangan", icon: Wallet, roles: ["admin", "bendahara"] },
  { href: "/admin/dashboard/dues", label: "Iuran Warga", icon: CreditCard, roles: ["admin", "bendahara"] },
  { href: "/admin/dashboard/assets", label: "Aset & Inventaris", icon: Package, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/letters", label: "Permohonan Surat", icon: FileText, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/complaints", label: "Pengaduan", icon: MessageSquareWarning, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/borrows", label: "Peminjaman Aset", icon: Handshake, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/announcements", label: "Pengumuman", icon: Megaphone, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/events", label: "Agenda & Absensi", icon: CalendarDays, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/umkm", label: "UMKM Warga", icon: ShoppingBag, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/broadcast", label: "Broadcast WA", icon: Smartphone, roles: ["admin", "staff"] },
  { href: "/admin/dashboard/logs", label: "Log Aktivitas", icon: Shield, roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) window.location.href = "/admin";
      else { setUser(d.user); setLoading(false); }
    }).catch(() => { window.location.href = "/admin"; });
  }, []);

  const loadNotifs = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications");
      const d = await r.json();
      setNotifs(d.notifications || []);
      setUnread(d.unreadCount || 0);
    } catch { /* abaikan */ }
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifs();
      const i = setInterval(loadNotifs, 30000);
      return () => clearInterval(i);
    }
  }, [user, loadNotifs]);

  async function markAllRead() {
    await fetch("/api/admin/notifications", { method: "PUT" });
    setUnread(0);
    loadNotifs();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat...</div>;
  if (!user) return null;

  const menu = MENU.filter((m) => m.roles.includes(user.role));
  const current = menu.find((m) => m.href === pathname);

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-900 to-indigo-900 transform transition-transform lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Building2 className="text-white" size={26} />
          <div>
            <div className="text-white font-bold text-sm">eRT/RW Digital</div>
            <div className="text-[10px] text-blue-300">Panel Pengurus — Serverless</div>
          </div>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} onClick={() => setSidebarOpen(false)}
              className={pathname === m.href ? "sidebar-link-active" : "sidebar-link"}>
              <m.icon size={16} /> <span>{m.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-blue-300 mb-2 px-2">{user.name} <span className="text-blue-400">({user.role})</span></div>
          <button onClick={handleLogout} className="sidebar-link w-full hover:bg-red-500/20 hover:text-red-300">
            <LogOut size={16} /> <span>Keluar</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
            <h1 className="text-lg font-bold text-gray-800">{current?.label || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 max-w-[85vw] bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b flex justify-between items-center sticky top-0 bg-white">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Tandai dibaca</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Tidak ada notifikasi</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className={`p-3 border-b text-sm ${n.isRead ? "" : "bg-blue-50"}`}>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-gray-500 text-xs mt-1">{n.message}</div>
                        <div className="text-gray-400 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString("id-ID")}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Globe size={16} /> <span className="hidden sm:inline">Situs</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
