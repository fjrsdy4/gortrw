"use client";

import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle2, Ban, PackageCheck } from "lucide-react";

interface Borrow {
  id: number; ticketNo: string; assetName: string | null; borrowerName: string; borrowerPhone: string | null;
  borrowDate: string; returnDate: string | null; actualReturnDate: string | null; status: string; purpose: string | null;
}

const SC: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", disetujui: "bg-blue-100 text-blue-700",
  ditolak: "bg-red-100 text-red-700", dikembalikan: "bg-green-100 text-green-700",
};

export default function BorrowsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);

  async function load() {
    const d = await fetch("/api/admin/borrows").then((r) => r.json());
    if (Array.isArray(d)) setBorrows(d);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(b: Borrow, status: string) {
    const body: Record<string, unknown> = { id: b.id, status };
    if (status === "dikembalikan") body.actualReturnDate = new Date().toISOString().split("T")[0];
    await fetch("/api/admin/borrows", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead><tr className="table-header">
          <th className="p-2">Tiket</th><th className="p-2">Aset</th><th className="p-2">Peminjam</th>
          <th className="p-2">Tgl Pinjam</th><th className="p-2">Tgl Kembali</th><th className="p-2">Status</th><th className="p-2">Aksi</th>
        </tr></thead>
        <tbody>
          {borrows.map((b) => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="p-2 font-mono text-xs">{b.ticketNo}</td>
              <td className="p-2 font-medium">{b.assetName}</td>
              <td className="p-2">
                <div>{b.borrowerName}</div>
                {b.borrowerPhone && (
                  <a href={"https://wa.me/" + b.borrowerPhone.replace(/\D/g, "").replace(/^0/, "62")} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-600 inline-flex items-center gap-1"><MessageCircle size={11} /> {b.borrowerPhone}</a>
                )}
              </td>
              <td className="p-2 text-xs">{b.borrowDate}</td>
              <td className="p-2 text-xs">{b.actualReturnDate || b.returnDate || "-"}</td>
              <td className="p-2"><span className={`badge ${SC[b.status]}`}>{b.status}</span></td>
              <td className="p-2">
                <div className="flex gap-1 flex-wrap">
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => setStatus(b, "disetujui")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle2 size={11} /> Setuju</button>
                      <button onClick={() => setStatus(b, "ditolak")} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded inline-flex items-center gap-1"><Ban size={11} /> Tolak</button>
                    </>
                  )}
                  {b.status === "disetujui" && (
                    <button onClick={() => setStatus(b, "dikembalikan")} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1"><PackageCheck size={11} /> Dikembalikan</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {borrows.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada peminjaman</div>}
    </div>
  );
}
