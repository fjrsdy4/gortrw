"use client";

import { useEffect, useState } from "react";
import { UserX, Play, CheckCircle2 } from "lucide-react";

interface Complaint {
  id: number; ticketNo: string; reporterName: string | null; isAnonymous: boolean;
  category: string | null; content: string; status: string; response: string | null; createdAt: string;
}

const SC: Record<string, string> = { baru: "bg-red-100 text-red-700", proses: "bg-yellow-100 text-yellow-700", selesai: "bg-green-100 text-green-700" };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  async function load() {
    const d = await fetch("/api/admin/complaints").then((r) => r.json());
    if (Array.isArray(d)) setComplaints(d);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(c: Complaint, status: string) {
    const response = prompt("Tanggapan untuk pelapor:") || "";
    await fetch("/api/admin/complaints", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, status, response }) });
    load();
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead><tr className="table-header">
          <th className="p-2">Tiket</th><th className="p-2">Pelapor</th><th className="p-2">Kategori</th>
          <th className="p-2">Isi</th><th className="p-2">Status</th><th className="p-2">Tanggapan</th><th className="p-2">Aksi</th>
        </tr></thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-2 font-mono text-xs">{c.ticketNo}</td>
              <td className="p-2">
                {c.isAnonymous
                  ? <span className="text-gray-400 italic inline-flex items-center gap-1"><UserX size={12} /> Anonim</span>
                  : c.reporterName}
              </td>
              <td className="p-2 text-xs">{c.category || "-"}</td>
              <td className="p-2 text-xs max-w-xs">{c.content}</td>
              <td className="p-2"><span className={`badge ${SC[c.status]}`}>{c.status}</span></td>
              <td className="p-2 text-xs">{c.response || "-"}</td>
              <td className="p-2">
                <div className="flex gap-1">
                  {c.status === "baru" && <button onClick={() => setStatus(c, "proses")} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-flex items-center gap-1"><Play size={11} /> Proses</button>}
                  {c.status !== "selesai" && <button onClick={() => setStatus(c, "selesai")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle2 size={11} /> Selesai</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {complaints.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada pengaduan</div>}
    </div>
  );
}
