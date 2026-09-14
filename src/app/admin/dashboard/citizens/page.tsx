"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, MessageCircle, Pencil, LogOut as MoveIcon, MoonStar, XCircle, Save } from "lucide-react";

interface Citizen {
  id: number; nik: string; name: string; gender: string; birthPlace: string | null; birthDate: string | null;
  religion: string | null; maritalStatus: string | null; occupation: string | null; phone: string | null;
  address: string | null; rt: string | null; rw: string | null; familyId: number | null; familyRelation: string | null;
  status: string; familyNoKK: string | null; familyHeadName: string | null;
}
interface Family { id: number; noKK: string; headName: string }

const RELIGIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const MARITAL = ["Belum Menikah", "Sudah Menikah", "Cerai Hidup", "Cerai Mati"];
const RELATIONS = ["Kepala Keluarga", "Istri", "Suami", "Anak", "Orang Tua", "Mertua", "Menantu", "Cucu", "Lainnya"];

function classifyAge(bd: string | null) {
  if (!bd) return "-";
  const t = new Date(); const b = new Date(bd);
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  if (age < 5) return `${age} th • Balita`;
  if (age < 12) return `${age} th • Anak`;
  if (age < 18) return `${age} th • Remaja`;
  if (age < 26) return `${age} th • Pemuda`;
  if (age < 46) return `${age} th • Dewasa`;
  if (age < 60) return `${age} th • Paruh Baya`;
  return `${age} th • Lansia`;
}

const emptyForm = {
  nik: "", name: "", gender: "L", birthPlace: "", birthDate: "", religion: "Islam",
  maritalStatus: "Belum Menikah", occupation: "", phone: "", address: "", rt: "001", rw: "002",
  familyId: 0, familyRelation: "",
};

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Citizen | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  async function load() {
    const [c, f] = await Promise.all([
      fetch(`/api/admin/citizens?status=aktif&search=${encodeURIComponent(search)}`).then((r) => r.json()),
      fetch("/api/admin/families").then((r) => r.json()),
    ]);
    if (Array.isArray(c)) setCitizens(c);
    if (Array.isArray(f)) setFamilies(f);
  }
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [search]);

  function openNew() { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); }
  function openEdit(c: Citizen) {
    setEditing(c);
    setForm({
      nik: c.nik, name: c.name, gender: c.gender, birthPlace: c.birthPlace || "", birthDate: c.birthDate || "",
      religion: c.religion || "Islam", maritalStatus: c.maritalStatus || "Belum Menikah", occupation: c.occupation || "",
      phone: c.phone || "", address: c.address || "", rt: c.rt || "001", rw: c.rw || "002",
      familyId: c.familyId || 0, familyRelation: c.familyRelation || "",
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, familyId: form.familyId || null };
    if (editing) {
      await fetch("/api/admin/citizens", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, id: editing.id, status: "aktif" }) });
    } else {
      await fetch("/api/admin/citizens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setShowForm(false);
    load();
  }

  async function markStatus(c: Citizen, status: "pindah" | "meninggal") {
    const note = prompt(`Catatan untuk status "${status}":`);
    if (note === null) return;
    await fetch("/api/admin/citizens", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, status, statusDate: new Date().toISOString().split("T")[0], statusNote: note }),
    });
    load();
  }

  const wa = (p: string) => "https://wa.me/" + p.replace(/\D/g, "").replace(/^0/, "62");
  const L = ({ children }: { children: string }) => <label className="text-xs font-medium text-gray-600">{children}</label>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Cari nama, NIK, atau HP..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><UserPlus size={15} /> Tambah Warga</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl my-8">
            <h3 className="text-lg font-bold mb-4">{editing ? "Edit Warga" : "Tambah Warga Baru"}</h3>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div><L>NIK *</L><input required maxLength={16} className="input-field" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} /></div>
              <div><L>Nama Lengkap *</L><input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><L>Jenis Kelamin *</L><select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div><L>Agama</L><select className="input-field" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}>{RELIGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><L>Tempat Lahir</L><input className="input-field" value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} /></div>
              <div><L>Tanggal Lahir</L><input type="date" className="input-field" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
              <div><L>Status Perkawinan</L><select className="input-field" value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>{MARITAL.map((m) => <option key={m}>{m}</option>)}</select></div>
              <div><L>Pekerjaan</L><input className="input-field" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
              <div><L>No. HP/WA</L><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><L>Kartu Keluarga</L><select className="input-field" value={form.familyId} onChange={(e) => setForm({ ...form, familyId: Number(e.target.value) })}><option value={0}>— pilih KK —</option>{families.map((f) => <option key={f.id} value={f.id}>{f.noKK} - {f.headName}</option>)}</select></div>
              <div><L>Hubungan keluarga</L><select className="input-field" value={form.familyRelation} onChange={(e) => setForm({ ...form, familyRelation: e.target.value })}><option value="">— pilih —</option>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><L>RT</L><input className="input-field" value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} /></div>
                <div><L>RW</L><input className="input-field" value={form.rw} onChange={(e) => setForm({ ...form, rw: e.target.value })} /></div>
              </div>
              <div className="col-span-2"><L>Alamat</L><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="col-span-2 flex gap-3 mt-1">
                <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="p-2">#</th><th className="p-2">NIK</th><th className="p-2">Nama</th><th className="p-2">L/P</th>
              <th className="p-2">Usia (auto)</th><th className="p-2">Agama</th><th className="p-2">No. KK</th>
              <th className="p-2">Hubungan</th><th className="p-2">WhatsApp</th><th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((c, i) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-mono text-xs">{c.nik}</td>
                <td className="p-2 font-medium whitespace-nowrap">{c.name}</td>
                <td className="p-2">{c.gender}</td>
                <td className="p-2 text-xs whitespace-nowrap">{classifyAge(c.birthDate)}</td>
                <td className="p-2 text-xs">{c.religion || "-"}</td>
                <td className="p-2 text-xs">{c.familyNoKK || "-"}</td>
                <td className="p-2 text-xs">{c.familyRelation || "-"}</td>
                <td className="p-2">
                  {c.phone ? (
                    <a href={wa(c.phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 text-xs inline-flex items-center gap-1">
                      <MessageCircle size={12} /> {c.phone}
                    </a>
                  ) : "-"}
                </td>
                <td className="p-2">
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => openEdit(c)} title="Edit" className="text-xs bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200"><Pencil size={12} /></button>
                    <button onClick={() => markStatus(c, "pindah")} title="Tandai pindah" className="text-xs bg-yellow-100 text-yellow-700 p-1.5 rounded hover:bg-yellow-200"><MoveIcon size={12} /></button>
                    <button onClick={() => markStatus(c, "meninggal")} title="Tandai meninggal" className="text-xs bg-gray-200 text-gray-700 p-1.5 rounded hover:bg-gray-300"><MoonStar size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {citizens.length === 0 && <div className="text-center py-8 text-gray-400">Belum ada data warga</div>}
      </div>
    </div>
  );
}
