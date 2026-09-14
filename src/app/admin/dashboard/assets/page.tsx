"use client";

import { useEffect, useState } from "react";
import { Plus, Save, XCircle, Pencil, Trash2, CheckCircle2, XCircle as XIc, MapPin, ImageIcon } from "lucide-react";

interface Asset {
  id: number; name: string; description: string | null; quantity: number;
  condition: string; location: string | null; photoUrl: string | null; isBorrowable: boolean;
}

const COND_COLOR: Record<string, string> = {
  Baik: "bg-green-100 text-green-700",
  "Rusak Ringan": "bg-yellow-100 text-yellow-700",
  "Rusak Berat": "bg-red-100 text-red-700",
};

const empty = { name: "", description: "", quantity: 1, condition: "Baik", location: "", isBorrowable: true };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [photo, setPhoto] = useState("");
  const [form, setForm] = useState({ ...empty });

  async function load() {
    const d = await fetch("/api/admin/assets").then((r) => r.json());
    if (Array.isArray(d)) setAssets(d);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ ...empty }); setPhoto(""); setShowForm(true); }
  function openEdit(a: Asset) {
    setEditing(a); setPhoto(a.photoUrl || "");
    setForm({ name: a.name, description: a.description || "", quantity: a.quantity, condition: a.condition, location: a.location || "", isBorrowable: a.isBorrowable });
    setShowForm(true);
  }

  async function readImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 800 / img.width);
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, photoUrl: photo || null };
    const method = editing ? "PUT" : "POST";
    await fetch("/api/admin/assets", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { ...body, id: editing.id } : body) });
    setShowForm(false); load();
  }

  async function remove(id: number) {
    if (!confirm("Hapus aset ini?")) return;
    await fetch(`/api/admin/assets?id=${id}`, { method: "DELETE" });
    load();
  }

  const L = ({ children }: { children: string }) => <label className="text-xs font-medium text-gray-600">{children}</label>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Aset & Inventaris</h2>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Tambah Aset</button>
      </div>

      {showForm && (
        <div className="card border-blue-300">
          <form onSubmit={save} className="grid md:grid-cols-3 gap-3">
            <div><L>Nama Aset *</L><input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><L>Jumlah</L><input type="number" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div><L>Kondisi</L><select className="input-field" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}><option>Baik</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></div>
            <div><L>Lokasi</L><input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="md:col-span-2"><L>Deskripsi</L><input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <L>Foto Aset</L>
              <input type="file" accept="image/*" className="input-field" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await readImage(f)); }} />
            </div>
            {photo && (
              <div className="flex items-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="foto aset" className="h-20 rounded-lg border object-cover" />
                <button type="button" onClick={() => setPhoto("")} className="text-xs text-red-600 underline">Hapus foto</button>
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isBorrowable} onChange={(e) => setForm({ ...form, isBorrowable: e.target.checked })} />
                Bisa dipinjam warga
              </label>
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((a) => (
          <div key={a.id} className="card p-4">
            {a.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photoUrl} alt={a.name} className="h-36 w-full object-cover rounded-lg mb-3" />
            ) : (
              <div className="h-36 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-300"><ImageIcon size={40} /></div>
            )}
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-gray-800">{a.name}</h3>
              <span className={`badge ${COND_COLOR[a.condition] || "bg-gray-100"}`}>{a.condition}</span>
            </div>
            {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>Jumlah: <strong>{a.quantity}</strong></div>
              {a.location && <div className="flex items-center gap-1"><MapPin size={12} /> {a.location}</div>}
              <div className="flex items-center gap-1">
                {a.isBorrowable
                  ? <><CheckCircle2 size={13} className="text-green-600" /> Bisa dipinjam warga</>
                  : <><XIc size={13} className="text-red-500" /> Tidak bisa dipinjam</>}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(a)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1"><Pencil size={12} /> Edit</button>
              <button onClick={() => remove(a.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded inline-flex items-center gap-1"><Trash2 size={12} /> Hapus</button>
            </div>
          </div>
        ))}
      </div>
      {assets.length === 0 && <div className="card text-center py-8 text-gray-400">Belum ada aset</div>}
    </div>
  );
}
