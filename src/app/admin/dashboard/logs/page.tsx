"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

interface Log {
  id: number; action: string; detail: string | null; createdAt: string;
  userName: string | null; userRole: string | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/admin/logs").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setLogs(d);
    }).catch(() => {});
  }, []);

  return (
    <div className="card">
      <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Shield className="text-blue-600" size={20} /> Log Aktivitas Petugas
      </h3>
      <p className="text-sm text-gray-500 mb-4">Rekam jejak semua aktivitas pengurus untuk transparansi dan audit (khusus admin).</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-header"><th className="p-2">Waktu</th><th className="p-2">Petugas</th><th className="p-2">Role</th><th className="p-2">Aksi</th><th className="p-2">Detail</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                <td className="p-2 font-medium">{l.userName || "-"}</td>
                <td className="p-2"><span className="badge bg-blue-100 text-blue-700">{l.userRole || "-"}</span></td>
                <td className="p-2">{l.action}</td>
                <td className="p-2 text-xs text-gray-500">{l.detail || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada log aktivitas</div>}
      </div>
    </div>
  );
}
