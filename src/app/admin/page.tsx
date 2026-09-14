"use client";

import { useState, useEffect } from "react";
import { Building2, Lock, LogIn, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) window.location.href = "/admin/dashboard";
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else window.location.href = "/admin/dashboard";
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-3">
            <Building2 size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">eRT/RW Digital</h1>
          <p className="text-sm text-gray-500 mt-1">Login Panel Pengurus</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input required className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <LogIn size={17} /> Masuk
          </button>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center space-y-1">
          <p className="font-semibold text-gray-600 flex items-center justify-center gap-1"><Lock size={12} /> Akun demo</p>
          <p>admin/admin123 • staff/staff123 • bendahara/bendahara123</p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke Halaman Utama
          </a>
        </div>
      </div>
    </div>
  );
}
