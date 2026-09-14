"use client";

import { useEffect, useState } from "react";
import { Plus, Save, XCircle, Trash2, Pin } from "lucide-react";

interface Announcement { id: number; title: string; content: string; isPinned: boolean; createdAt: string }

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPinned: false });

  async function load() {
    const d = await fetch("/api/admin/announcements").then((r) => r.json());
    if (Array.isArray(d)) setList(d);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setForm({ title: "", content: "", isPinned: false }); load();
  }

  async function remove(id: number) {
    if (!confirm("Hapus pengumuman ini?")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Pengumuman</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Buat Pengumuman</button>
      </div>

      {showForm && (
        <div className="card border-blue-300">
          <form onSubmit={save} className="space-y-3">
            <div><label className="text-xs font-medium text-gray-600">Judul *</label>
              <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Isi *</label>
              <textarea required rows={4} className="input-field" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /> Sematkan di atas
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {list.map((a) => (
          <div key={a.id} className={`card ${a.isPinned ? "border-yellow-300 bg-yellow-50" : ""}`}>
            <div className="flex justify-between items-start gap-3">
              <div>
                {a.isPinned && <span className="inline-flex items-center gap-1 text-xs text-yellow-700 font-semibold"><Pin size={12} /> Disematkan</span>}
                <h3 className="font-bold text-gray-800">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
              <button onClick={() => remove(a.id)} className="text-xs bg-red-100 text-red-700 p-1.5 rounded shrink-0"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="card text-center py-8 text-gray-400">Belum ada pengumuman</div>}
      </div>
    </div>
  );
}
