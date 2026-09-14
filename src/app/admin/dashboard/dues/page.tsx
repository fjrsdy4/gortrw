"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";

interface DueType { id: number; name: string; amount: string }
interface CitizenMin { id: number; name: string }
interface Payment { id: number; citizenId: number; dueTypeId: number; month: number; year: number; paid: boolean }
interface DuesData { types: DueType[]; citizens: CitizenMin[]; payments: Payment[] }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function DuesPage() {
  const [data, setData] = useState<DuesData | null>(null);
  const [typeId, setTypeId] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState(false);

  async function load() {
    const d: DuesData = await fetch("/api/admin/dues").then((r) => r.json());
    setData(d);
    if (d.types?.length && !typeId) setTypeId(d.types[0].id);
  }
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  if (!data) return <div className="text-center py-10 text-gray-400">Memuat...</div>;

  const isPaid = (cid: number, m: number) =>
    data.payments.some((p) => p.citizenId === cid && p.dueTypeId === typeId && p.month === m && p.year === year && p.paid);

  async function toggle(cid: number, m: number) {
    const paid = isPaid(cid, m);
    const msg = paid
      ? "Batalkan ceklis iuran ini? Transaksi kas terkait ikut dihapus."
      : "Tandai lunas? Otomatis tercatat ke arus kas dengan ID transaksi unik.";
    if (!confirm(msg)) return;
    setBusy(true);
    await fetch("/api/admin/dues", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citizenId: cid, dueTypeId: typeId, month: m, year, action: paid ? "unpay" : "pay" }),
    });
    await load();
    setBusy(false);
  }

  async function addType() {
    const name = prompt("Nama jenis iuran (misal: Iuran Bulanan):");
    if (!name) return;
    const amount = prompt("Nominal per bulan/kegiatan (Rp):");
    if (!amount) return;
    await fetch("/api/admin/dues", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount }) });
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Sistem <strong>ceklis iuran</strong>: klik sel bulan untuk menandai lunas (otomatis masuk arus kas dengan ID transaksi), klik lagi untuk membatalkan.
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <select className="input-field w-auto" value={typeId} onChange={(e) => setTypeId(Number(e.target.value))}>
          {data.types.map((t) => <option key={t.id} value={t.id}>{t.name} — Rp {parseFloat(t.amount).toLocaleString("id-ID")}</option>)}
        </select>
        <select className="input-field w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={addType} className="px-3 py-2 bg-white border rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-50">
          <Plus size={14} /> Jenis Iuran
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="p-2 sticky left-0 bg-gray-50">Warga</th>
              {MONTHS.map((m) => <th key={m} className="p-2 text-center">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.citizens.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2 font-medium sticky left-0 bg-white whitespace-nowrap">{c.name}</td>
                {MONTHS.map((_, mi) => {
                  const paid = isPaid(c.id, mi + 1);
                  return (
                    <td key={mi} className="p-1 text-center">
                      <button onClick={() => toggle(c.id, mi + 1)} disabled={busy}
                        className={`w-8 h-8 rounded-lg transition flex items-center justify-center mx-auto ${
                          paid ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-yellow-200 text-transparent"
                        }`}>
                        <Check size={15} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.citizens.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada data</div>}
      </div>
    </div>
  );
}
