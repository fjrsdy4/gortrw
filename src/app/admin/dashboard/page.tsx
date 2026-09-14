"use client";

import { useEffect, useState } from "react";
import { Users, Home, Package, Landmark, TrendingUp, TrendingDown } from "lucide-react";

const fmt = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(typeof v === "string" ? parseFloat(v) : Number(v));

interface Stats {
  citizenCount: number; familyCount: number; assetCount: number;
  income: string; expense: string; balance: string;
  genderStats: { gender: string; count: number }[];
  religionStats: { religion: string | null; count: number }[];
  maritalStats: { status: string | null; count: number }[];
  ageStats: { age_group: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/public/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);

  if (!stats) return <div className="text-center py-10 text-gray-400">Memuat data...</div>;

  const total = stats.citizenCount || 1;
  const row = (label: string, count: number) => (
    <div key={label} className="flex justify-between text-sm mb-1.5">
      <span>{label}</span>
      <span className="font-medium">{count} <span className="text-gray-400">({((count / total) * 100).toFixed(0)}%)</span></span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, val: stats.citizenCount, label: "Warga Aktif" },
          { icon: Home, val: stats.familyCount, label: "Kepala Keluarga" },
          { icon: Package, val: stats.assetCount, label: "Aset Inventaris" },
          { icon: Landmark, val: fmt(stats.balance), label: "Saldo Kas", small: true },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <c.icon size={20} />
            </div>
            <div>
              <div className={`font-bold text-gray-800 ${c.small ? "text-base" : "text-2xl"}`}>{c.val}</div>
              <div className="text-xs text-gray-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium flex items-center gap-1.5"><TrendingUp size={15} /> Total Pemasukan</div>
          <div className="text-2xl font-bold text-green-700">{fmt(stats.income)}</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="text-sm text-red-600 font-medium flex items-center gap-1.5"><TrendingDown size={15} /> Total Pengeluaran</div>
          <div className="text-2xl font-bold text-red-700">{fmt(stats.expense)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><h3 className="font-semibold text-gray-700 mb-3 text-sm">Jenis Kelamin</h3>
          {stats.genderStats.map((g) => row(g.gender === "L" ? "Laki-laki" : "Perempuan", g.count))}</div>
        <div className="card"><h3 className="font-semibold text-gray-700 mb-3 text-sm">Agama</h3>
          {stats.religionStats.map((r) => row(r.religion || "-", r.count))}</div>
        <div className="card"><h3 className="font-semibold text-gray-700 mb-3 text-sm">Kelompok Usia</h3>
          {stats.ageStats.map((a) => row(a.age_group, a.count))}</div>
        <div className="card"><h3 className="font-semibold text-gray-700 mb-3 text-sm">Status Perkawinan</h3>
          {stats.maritalStats.map((m) => row(m.status || "-", m.count))}</div>
      </div>
    </div>
  );
}
