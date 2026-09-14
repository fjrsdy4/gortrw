"use client";

import { useEffect, useState } from "react";
import { FolderOpen, MoonStar } from "lucide-react";

interface Citizen { id: number; nik: string; name: string; gender: string; statusDate: string | null; statusNote: string | null }

export default function InactiveCitizensPage() {
  const [tab, setTab] = useState<"pindah" | "meninggal">("pindah");
  const [citizens, setCitizens] = useState<Citizen[]>([]);

  useEffect(() => {
    fetch(`/api/admin/citizens?status=${tab}`).then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCitizens(d);
    }).catch(() => {});
  }, [tab]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Data warga <strong>pindah</strong> dan <strong>meninggal</strong> otomatis terpisah di sini — tidak merusak akumulasi warga aktif di dashboard.
      </p>
      <div className="flex gap-2">
        <button onClick={() => setTab("pindah")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${tab === "pindah" ? "bg-yellow-500 text-white" : "bg-white border"}`}>
          <FolderOpen size={15} /> Pindah
        </button>
        <button onClick={() => setTab("meninggal")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${tab === "meninggal" ? "bg-gray-600 text-white" : "bg-white border"}`}>
          <MoonStar size={15} /> Meninggal
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="table-header"><th className="p-2">#</th><th className="p-2">NIK</th><th className="p-2">Nama</th><th className="p-2">L/P</th><th className="p-2">Tanggal</th><th className="p-2">Catatan</th></tr></thead>
          <tbody>
            {citizens.map((c, i) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-mono text-xs">{c.nik}</td>
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2">{c.gender}</td>
                <td className="p-2 text-xs">{c.statusDate || "-"}</td>
                <td className="p-2 text-xs">{c.statusNote || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {citizens.length === 0 && <div className="text-center py-8 text-gray-400">Tidak ada data</div>}
      </div>
    </div>
  );
}
