"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, Home, Package, CalendarDays, Megaphone, Pin, MapPin, Clock,
  TrendingUp, TrendingDown, Landmark, Receipt, Wrench, FileText, MessageSquareWarning,
  Send, ShoppingBag, MessageCircle, Download, Lock, Store, Eye, ShieldCheck, Server,
} from "lucide-react";

interface Announcement { id: number; title: string; content: string; isPinned: boolean; createdAt: string }
interface EventItem { id: number; title: string; description: string | null; eventDate: string; eventTime: string | null; location: string | null }
interface Expense { id: number; txId: string; category: string; description: string; amount: string; txDate: string }
interface Product { id: number; productName: string; description: string | null; price: string; whatsapp: string; photoUrl: string | null }
interface StatRow { label: string; count: number }
interface Stats {
  citizenCount: number; familyCount: number; assetCount: number;
  genderStats: { gender: string; count: number }[];
  religionStats: { religion: string | null; count: number }[];
  maritalStats: { status: string | null; count: number }[];
  ageStats: { age_group: string; count: number }[];
  announcements: Announcement[]; events: EventItem[];
  income: string; expense: string; balance: string;
  recentExpenses: Expense[]; products: Product[];
}

const fmt = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(typeof v === "string" ? parseFloat(v) : v);

const fd = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

function downloadCsv(filename: string, rows: StatRow[], totalLabel: string) {
  const lines = [["Kategori", "Jumlah", "Persentase"].join(";")];
  const total = rows.reduce((s, r) => s + r.count, 0);
  rows.forEach((r) => lines.push([r.label, String(r.count), ((r.count / (total || 1)) * 100).toFixed(1) + "%"].join(";")));
  lines.push(["TOTAL", String(total), "100%"].join(";"));
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename || totalLabel;
  a.click();
}

const wa = (phone: string) => "https://wa.me/" + phone.replace(/\D/g, "").replace(/^0/, "62");

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [seeding, setSeeding] = useState(true);
  const [activeTab, setActiveTab] = useState<"surat" | "aduan" | "pinjam">("surat");
  const [ticketNo, setTicketNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<{ id: number; name: string; quantity: number }[]>([]);

  const [letter, setLetter] = useState({ requesterName: "", requesterPhone: "", letterType: "Surat Keterangan Domisili", purpose: "" });
  const [complaint, setComplaint] = useState({ reporterName: "", isAnonymous: false, category: "Lingkungan", content: "" });
  const [borrow, setBorrow] = useState({ borrowerName: "", borrowerPhone: "", assetId: 0, borrowDate: "", returnDate: "", purpose: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/public/stats");
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch { /* abaikan */ }
  }, []);

  useEffect(() => {
    (async () => {
      try { await fetch("/api/seed", { method: "POST" }); } catch { /* abaikan */ }
      setSeeding(false);
      load();
    })();
    fetch("/api/public/assets-list").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAssets(d); }).catch(() => {});
  }, [load]);

  async function submit(e: React.FormEvent, url: string, body: object) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (data.ticketNo) setTicketNo(data.ticketNo);
    else alert(data.error || "Gagal mengirim");
  }

  if (seeding)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-white text-xl flex items-center gap-3">
          <Server className="animate-pulse" /> Menyiapkan serverless functions...
        </div>
      </div>
    );

  const total = stats?.citizenCount || 0;
  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : "0.0");

  const genderRows: StatRow[] = (stats?.genderStats || []).map((g) => ({ label: g.gender === "L" ? "Laki-laki" : "Perempuan", count: g.count }));
  const religionRows: StatRow[] = (stats?.religionStats || []).map((r) => ({ label: r.religion || "Belum Diisi", count: r.count }));
  const maritalRows: StatRow[] = (stats?.maritalStats || []).map((m) => ({ label: m.status || "Belum Diisi", count: m.count }));
  const ageRows: StatRow[] = (stats?.ageStats || []).map((a) => ({ label: a.age_group, count: a.count }));

  const bar = (label: string, count: number, color: string) => (
    <div key={label} className="mb-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{count} ({pct(count)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct(count)}%` }} />
      </div>
    </div>
  );

  const downloadBtn = (label: string, rows: StatRow[], file: string) => (
    <button
      onClick={() => downloadCsv(file, rows, file)}
      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition"
    >
      <Download size={13} /> Unduh rincian {label}
    </button>
  );

  return (
    <div className="min-h-screen">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-blue-900/80 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/15 rounded-lg p-1.5"><Building2 size={22} /></div>
            <div>
              <div className="font-bold leading-tight">eRT/RW Digital</div>
              <div className="text-[10px] text-blue-200">Serverless • Transparan • Modern</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm text-blue-100">
            <a href="#pengumuman" className="hover:text-white">Pengumuman</a>
            <a href="#demografi" className="hover:text-white">Demografi</a>
            <a href="#keuangan" className="hover:text-white">Keuangan</a>
            <a href="#layanan" className="hover:text-white">Layanan</a>
            <a href="#umkm" className="hover:text-white">UMKM</a>
          </div>
          <a href="/admin" className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition flex items-center gap-1.5">
            <Lock size={14} /> Login Pengurus
          </a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-28 pb-20 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-blue-100 mb-6">
            <ShieldCheck size={13} /> Portal resmi lingkungan — data transparan & real-time
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">Selamat Datang, Warga!</h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-10">
            Satu pintu untuk informasi kegiatan, keuangan, aset, dan layanan administrasi lingkungan Anda.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Users, val: total, label: "Total Warga" },
              { icon: Home, val: stats?.familyCount ?? 0, label: "Kepala Keluarga" },
              { icon: Package, val: stats?.assetCount ?? 0, label: "Aset Umum" },
              { icon: CalendarDays, val: stats?.events.length ?? 0, label: "Agenda Mendatang" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition">
                <s.icon className="mx-auto mb-2 text-blue-200" size={26} />
                <div className="text-3xl font-extrabold">{s.val}</div>
                <div className="text-xs text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 -mt-8 relative z-10 space-y-8 pb-12">
        {/* ===== PENGUMUMAN ===== */}
        {(stats?.announcements.length ?? 0) > 0 && (
          <section id="pengumuman" className="card shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Megaphone className="text-blue-600" size={22} /> Pengumuman Warga
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats!.announcements.map((a) => (
                <div key={a.id} className={`p-4 rounded-xl border ${a.isPinned ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
                  {a.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 mb-1">
                      <Pin size={12} /> Disematkan
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{fd(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== AGENDA ===== */}
        {(stats?.events.length ?? 0) > 0 && (
          <section className="card shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={22} /> Agenda Kegiatan Mendatang
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {stats!.events.map((ev) => (
                <div key={ev.id} className="border border-blue-200 bg-blue-50/70 rounded-xl p-4">
                  <div className="text-sm font-bold text-blue-700">{fd(ev.eventDate)}</div>
                  {ev.eventTime && (
                    <div className="text-xs text-blue-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> {ev.eventTime} WIB</div>
                  )}
                  <h3 className="font-semibold text-gray-800 mt-2">{ev.title}</h3>
                  {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
                  {ev.location && <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><MapPin size={12} /> {ev.location}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== DEMOGRAFI ===== */}
        <section id="demografi" className="card shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="text-blue-600" size={22} /> Demografi Warga Aktif
            </h2>
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">{total} jiwa</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Jenis Kelamin</h3>
              {genderRows.map((r) => bar(r.label, r.count, r.label === "Laki-laki" ? "bg-blue-500" : "bg-pink-500"))}
              {downloadBtn("gender", genderRows, "demografi-jenis-kelamin.csv")}
            </div>
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Agama</h3>
              {religionRows.map((r) => bar(r.label, r.count, "bg-green-500"))}
              {downloadBtn("agama", religionRows, "demografi-agama.csv")}
            </div>
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Rentang Usia</h3>
              {ageRows.map((r) => bar(r.label, r.count, "bg-purple-500"))}
              {downloadBtn("usia", ageRows, "demografi-rentang-usia.csv")}
            </div>
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Status Perkawinan</h3>
              {maritalRows.map((r) => bar(r.label, r.count, "bg-orange-500"))}
              {downloadBtn("perkawinan", maritalRows, "demografi-status-perkawinan.csv")}
            </div>
          </div>
        </section>

        {/* ===== KEUANGAN ===== */}
        <section id="keuangan" className="card shadow-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Landmark className="text-blue-600" size={22} /> Transparansi Keuangan
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1.5"><TrendingUp size={15} /> Total Pemasukan</div>
              <div className="text-xl font-extrabold text-green-700 mt-1">{fmt(stats?.income || "0")}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-1.5"><TrendingDown size={15} /> Total Pengeluaran</div>
              <div className="text-xl font-extrabold text-red-700 mt-1">{fmt(stats?.expense || "0")}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-sm text-blue-600 font-medium flex items-center justify-center gap-1.5"><Landmark size={15} /> Saldo Kas</div>
              <div className="text-xl font-extrabold text-blue-700 mt-1">{fmt(stats?.balance || "0")}</div>
            </div>
          </div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-1.5 text-sm">
            <Receipt size={15} /> Rincian Pengeluaran Terakhir (transparansi alokasi dana)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2">Tanggal</th><th className="p-2">ID Transaksi</th><th className="p-2">Alokasi</th>
                  <th className="p-2">Keterangan</th><th className="p-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentExpenses || []).map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{fd(t.txDate)}</td>
                    <td className="p-2 font-mono text-xs">{t.txId}</td>
                    <td className="p-2">{t.category}</td>
                    <td className="p-2">{t.description}</td>
                    <td className="p-2 text-right text-red-600 font-medium">{fmt(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== LAYANAN MANDIRI ===== */}
        <section id="layanan" className="card shadow-lg">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wrench className="text-blue-600" size={22} /> Layanan Mandiri Warga
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Ajukan permohonan tanpa login — langsung terbit nomor tiket instan yang bisa Anda simpan.
          </p>

          {ticketNo ? (
            <div className="p-5 bg-green-50 border border-green-300 rounded-xl text-center">
              <ShieldCheck className="mx-auto text-green-600 mb-1" size={30} />
              <p className="text-green-800 font-medium">Permohonan berhasil dikirim!</p>
              <p className="text-xl font-extrabold font-mono text-green-900 mt-1">{ticketNo}</p>
              <p className="text-sm text-green-600">Simpan nomor tiket ini sebagai bukti pengajuan Anda.</p>
              <button onClick={() => setTicketNo("")} className="mt-3 text-sm text-green-700 underline">Ajukan permohonan lain</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-5 flex-wrap">
                {([
                  { id: "surat", label: "Permohonan Surat", icon: FileText },
                  { id: "aduan", label: "Pengaduan", icon: MessageSquareWarning },
                  { id: "pinjam", label: "Pinjam Aset", icon: Package },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      activeTab === t.id ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
              </div>

              {activeTab === "surat" && (
                <form onSubmit={(e) => submit(e, "/api/public/letter-request", letter)} className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
                    <input required className="input-field" value={letter.requesterName} onChange={(e) => setLetter({ ...letter, requesterName: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">No. WhatsApp</label>
                    <input className="input-field" placeholder="08xx" value={letter.requesterPhone} onChange={(e) => setLetter({ ...letter, requesterPhone: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Jenis Surat *</label>
                    <select className="input-field" value={letter.letterType} onChange={(e) => setLetter({ ...letter, letterType: e.target.value })}>
                      {["Surat Keterangan Domisili", "Surat Keterangan Tidak Mampu", "Surat Pengantar KTP", "Surat Pengantar KK", "Surat Keterangan Usaha", "Surat Keterangan Pindah", "Surat Pengantar SKCK", "Lainnya"].map((o) => <option key={o}>{o}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium mb-1">Keperluan</label>
                    <input className="input-field" value={letter.purpose} onChange={(e) => setLetter({ ...letter, purpose: e.target.value })} /></div>
                  <div className="md:col-span-2">
                    <button disabled={loading} className="btn-primary flex items-center gap-1.5 disabled:opacity-50"><Send size={15} /> {loading ? "Mengirim..." : "Kirim Permohonan"}</button>
                  </div>
                </form>
              )}

              {activeTab === "aduan" && (
                <form onSubmit={(e) => submit(e, "/api/public/complaint", complaint)} className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Nama Pelapor</label>
                    <input className="input-field" disabled={complaint.isAnonymous} value={complaint.reporterName}
                      onChange={(e) => setComplaint({ ...complaint, reporterName: e.target.value })} /></div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={complaint.isAnonymous}
                        onChange={(e) => setComplaint({ ...complaint, isAnonymous: e.target.checked, reporterName: "" })} className="rounded" />
                      <Eye size={14} /> Kirim sebagai anonim
                    </label>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Kategori</label>
                    <select className="input-field" value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })}>
                      {["Lingkungan", "Keamanan", "Infrastruktur", "Ketertiban", "Lainnya"].map((o) => <option key={o}>{o}</option>)}
                    </select></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Isi Pengaduan *</label>
                    <textarea required rows={3} className="input-field" value={complaint.content}
                      onChange={(e) => setComplaint({ ...complaint, content: e.target.value })} /></div>
                  <div className="md:col-span-2">
                    <button disabled={loading} className="btn-primary flex items-center gap-1.5 disabled:opacity-50"><Send size={15} /> {loading ? "Mengirim..." : "Kirim Pengaduan"}</button>
                  </div>
                </form>
              )}

              {activeTab === "pinjam" && (
                <form onSubmit={(e) => submit(e, "/api/public/borrow", borrow)} className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Nama Peminjam *</label>
                    <input required className="input-field" value={borrow.borrowerName} onChange={(e) => setBorrow({ ...borrow, borrowerName: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">No. WhatsApp</label>
                    <input className="input-field" value={borrow.borrowerPhone} onChange={(e) => setBorrow({ ...borrow, borrowerPhone: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Pilih Aset *</label>
                    <select required className="input-field" value={borrow.assetId} onChange={(e) => setBorrow({ ...borrow, assetId: Number(e.target.value) })}>
                      <option value={0}>— pilih aset —</option>
                      {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.quantity})</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium mb-1">Keperluan</label>
                    <input className="input-field" value={borrow.purpose} onChange={(e) => setBorrow({ ...borrow, purpose: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Tanggal Pinjam *</label>
                    <input required type="date" className="input-field" value={borrow.borrowDate} onChange={(e) => setBorrow({ ...borrow, borrowDate: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Tanggal Kembali</label>
                    <input type="date" className="input-field" value={borrow.returnDate} onChange={(e) => setBorrow({ ...borrow, returnDate: e.target.value })} /></div>
                  <div className="md:col-span-2">
                    <button disabled={loading} className="btn-primary flex items-center gap-1.5 disabled:opacity-50"><Send size={15} /> {loading ? "Mengirim..." : "Ajukan Peminjaman"}</button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        {/* ===== UMKM ===== */}
        {(stats?.products.length ?? 0) > 0 && (
          <section id="umkm" className="card shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={22} /> Etalase UMKM Warga
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats!.products.map((p) => (
                <div key={p.id} className="border rounded-xl p-4 hover:shadow-md transition bg-white">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt={p.productName} className="h-32 w-full object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center mb-3">
                      <Store className="text-orange-400" size={40} />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-800">{p.productName}</h3>
                  {p.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>}
                  {Number(p.price) > 0 && <p className="text-sm font-bold text-green-700 mt-2">{fmt(p.price)}</p>}
                  {p.whatsapp && (
                    <a href={`${wa(p.whatsapp)}?text=Halo, saya tertarik dengan ${encodeURIComponent(p.productName)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition">
                      <MessageCircle size={14} /> Chat WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg font-bold text-white flex items-center justify-center gap-2"><Building2 size={20} /> eRT/RW Digital</p>
          <p className="text-sm mt-1">Sistem Manajemen RT/RW — Transparan, Mudah, Modern</p>
          <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
            <Server size={12} /> Dibangun di atas Vercel Serverless Functions + PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}
