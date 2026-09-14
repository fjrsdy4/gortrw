"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Landmark, Plus, Save, XCircle, FileDown, ImageIcon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Tx {
  id: number; txId: string; txType: string; category: string; description: string | null;
  amount: string; txDate: string; proofUrl: string | null;
}

const fmt = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(typeof v === "string" ? parseFloat(v) : v);

// Kompres gambar -> data URL (upload foto bukti, tersimpan di PostgreSQL)
function compressImage(file: File, maxW = 900): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.72));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function FinancePage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "masuk" | "keluar">("all");
  const [proofData, setProofData] = useState("");
  const [form, setForm] = useState({ txType: "masuk", category: "", description: "", amount: "", txDate: new Date().toISOString().split("T")[0] });

  async function load() {
    const d = await fetch("/api/admin/transactions").then((r) => r.json());
    if (Array.isArray(d)) setTxs(d);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, proofUrl: proofData || null }),
    });
    setShowForm(false); setProofData("");
    setForm({ txType: "masuk", category: "", description: "", amount: "", txDate: new Date().toISOString().split("T")[0] });
    load();
  }

  // Ekspor laporan PDF (di sisi browser — arus kas masih dari serverless API)
  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text("LAPORAN KEUANGAN RT/RW", 14, 16);
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 23);
    autoTable(doc, {
      head: [["Tanggal", "ID Transaksi", "Tipe", "Kategori", "Keterangan", "Jumlah"]],
      body: txs.map((t) => [
        t.txDate, t.txId, t.txType === "masuk" ? "Masuk" : "Keluar", t.category, t.description || "-", fmt(t.amount),
      ]),
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      foot: [[
        "TOTAL", "", "", "", `Masuk: ${fmt(totalIn)}  Keluar: ${fmt(totalOut)}`, `Saldo: ${fmt(totalIn - totalOut)}`,
      ]],
      footStyles: { fillColor: [219, 234, 254], textColor: [30, 58, 138], fontStyle: "bold" },
    });
    doc.save(`Laporan-Keuangan-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  const filtered = filter === "all" ? txs : txs.filter((t) => t.txType === filter);
  const totalIn = txs.filter((t) => t.txType === "masuk").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalOut = txs.filter((t) => t.txType === "keluar").reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 flex items-center gap-1.5"><TrendingUp size={15} /> Pemasukan</div>
          <div className="text-xl font-bold text-green-700">{fmt(totalIn)}</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="text-sm text-red-600 flex items-center gap-1.5"><TrendingDown size={15} /> Pengeluaran</div>
          <div className="text-xl font-bold text-red-700">{fmt(totalOut)}</div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 flex items-center gap-1.5"><Landmark size={15} /> Saldo Kas</div>
          <div className="text-xl font-bold text-blue-700">{fmt(totalIn - totalOut)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(["all", "masuk", "keluar"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-white border"}`}>
              {f === "all" ? "Semua" : f === "masuk" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportPdf} className="btn-danger flex items-center gap-1.5"><FileDown size={15} /> Cetak PDF</button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Transaksi</button>
        </div>
      </div>

      {showForm && (
        <div className="card border-blue-300">
          <form onSubmit={save} className="grid md:grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-gray-600">Tipe *</label>
              <select className="input-field" value={form.txType} onChange={(e) => setForm({ ...form, txType: e.target.value })}>
                <option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600">Kategori/Alokasi *</label>
              <input required className="input-field" value={form.category} placeholder="Iuran/Sumbangan/Operasional" onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Jumlah (Rp) *</label>
              <input required type="number" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Tanggal *</label>
              <input required type="date" className="input-field" value={form.txDate} onChange={(e) => setForm({ ...form, txDate: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600">Keterangan</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><ImageIcon size={13} /> Upload Foto Bukti (opsional, otomatis dikompres)</label>
              <input type="file" accept="image/*" className="input-field"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) setProofData(await compressImage(f)); }} />
              {proofData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofData} alt="bukti" className="mt-2 h-24 rounded-lg border object-cover" />
              )}
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="table-header">
            <th className="p-2">Tanggal</th><th className="p-2">ID Transaksi</th><th className="p-2">Tipe</th>
            <th className="p-2">Alokasi</th><th className="p-2">Keterangan</th><th className="p-2">Bukti</th><th className="p-2 text-right">Jumlah</th>
          </tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-xs whitespace-nowrap">{t.txDate}</td>
                <td className="p-2 font-mono text-xs">{t.txId}</td>
                <td className="p-2">
                  <span className={`badge ${t.txType === "masuk" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {t.txType === "masuk" ? "Masuk" : "Keluar"}
                  </span>
                </td>
                <td className="p-2">{t.category}</td>
                <td className="p-2 text-xs">{t.description}</td>
                <td className="p-2">
                  {t.proofUrl ? (
                    <a href={t.proofUrl} target="_blank" rel="noopener noreferrer" title="Lihat bukti">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.proofUrl} alt="bukti" className="w-10 h-10 object-cover rounded border" />
                    </a>
                  ) : "-"}
                </td>
                <td className={`p-2 text-right font-medium ${t.txType === "masuk" ? "text-green-700" : "text-red-700"}`}>
                  {t.txType === "masuk" ? "+" : "-"}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada transaksi</div>}
      </div>
    </div>
  );
}
