"use client";

import { useEffect, useState } from "react";
import { Plus, Save, XCircle, Pencil, Trash2, Store, ImageIcon } from "lucide-react";

interface Product {
  id: number; productName: string; description: string | null; price: string | null;
  whatsapp: string | null; photoUrl: string | null; isActive: boolean;
}

const empty = { productName: "", description: "", price: "", whatsapp: "", isActive: true };

export default function UMKMPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [photo, setPhoto] = useState("");
  const [form, setForm] = useState({ ...empty });

  async function load() {
    const d = await fetch("/api/admin/umkm").then((r) => r.json());
    if (Array.isArray(d)) setProducts(d);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ ...empty }); setPhoto(""); setShowForm(true); }
  function openEdit(p: Product) {
    setEditing(p); setPhoto(p.photoUrl || "");
    setForm({ productName: p.productName, description: p.description || "", price: p.price || "", whatsapp: p.whatsapp || "", isActive: p.isActive });
    setShowForm(true);
  }

  function readImage(file: File): Promise<string> {
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
    await fetch("/api/admin/umkm", {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body),
    });
    setShowForm(false); load();
  }

  async function remove(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/admin/umkm?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Produk UMKM Warga</h2>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Tambah Produk</button>
      </div>

      {showForm && (
        <div className="card border-blue-300">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-600">Nama Produk *</label>
              <input required className="input-field" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Harga (Rp)</label>
              <input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">No. WhatsApp Pemilik</label>
              <input className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="08xx" /></div>
            <div><label className="text-xs font-medium text-gray-600">Deskripsi</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className="text-xs font-medium text-gray-600">Foto Produk</label>
              <input type="file" accept="image/*" className="input-field" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await readImage(f)); }} />
            </div>
            {photo && (
              <div className="flex items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="foto produk" className="h-20 rounded-lg border object-cover" />
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Tampilkan di halaman depan
              </label>
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="table-header"><th className="p-2">Produk</th><th className="p-2">Deskripsi</th><th className="p-2">Harga</th><th className="p-2">WA</th><th className="p-2">Status</th><th className="p-2">Aksi</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-orange-50 flex items-center justify-center text-orange-300"><Store size={18} /></div>
                    )}
                    <span className="font-medium">{p.productName}</span>
                  </div>
                </td>
                <td className="p-2 text-xs max-w-[200px]">{p.description || "-"}</td>
                <td className="p-2 whitespace-nowrap">{Number(p.price) > 0 ? `Rp ${parseFloat(p.price!).toLocaleString("id-ID")}` : "-"}</td>
                <td className="p-2 text-xs">{p.whatsapp || "-"}</td>
                <td className="p-2"><span className={`badge ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Aktif" : "Nonaktif"}</span></td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="text-xs bg-blue-100 text-blue-700 p-1.5 rounded"><Pencil size={12} /></button>
                    <button onClick={() => remove(p.id)} className="text-xs bg-red-100 text-red-700 p-1.5 rounded"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2"><ImageIcon size={32} className="text-gray-300" /> Belum ada produk</div>}
      </div>
    </div>
  );
}
