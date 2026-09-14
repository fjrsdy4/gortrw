"use client";

import { useEffect, useState } from "react";
import { Plus, Save, XCircle, Trash2, Printer, FileText, Clock, MapPin, X, Check } from "lucide-react";

interface Ev {
  id: number; title: string; description: string | null; eventDate: string;
  eventTime: string | null; location: string | null; minutesUrl: string | null;
}
interface AttRow { id: number; name: string; address: string | null; rt: string | null; rw: string | null; present: boolean }

export default function EventsPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", eventTime: "", location: "" });
  const [attEvent, setAttEvent] = useState<Ev | null>(null);
  const [attRows, setAttRows] = useState<AttRow[]>([]);

  async function load() {
    const d = await fetch("/api/admin/events").then((r) => r.json());
    if (Array.isArray(d)) setEvents(d);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setForm({ title: "", description: "", eventDate: "", eventTime: "", location: "" }); load();
  }

  async function remove(id: number) {
    if (!confirm("Hapus agenda ini (absensi ikut terhapus)?")) return;
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    load();
  }

  async function saveNotulen(ev: Ev) {
    const notulen = prompt("Tulis notulen / ringkasan laporan kegiatan:", ev.minutesUrl || "");
    if (notulen === null) return;
    await fetch("/api/admin/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ev.id, minutesUrl: notulen }) });
    load();
  }

  async function openAttendance(ev: Ev) {
    setAttEvent(ev);
    const d = await fetch(`/api/admin/attendance?eventId=${ev.id}`).then((r) => r.json());
    if (Array.isArray(d)) setAttRows(d);
  }

  async function togglePresent(citizenId: number, present: boolean) {
    setAttRows((rows) => rows.map((r) => (r.id === citizenId ? { ...r, present } : r)));
    if (attEvent) {
      await fetch("/api/admin/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: attEvent.id, citizenId, present }),
      });
    }
  }

  function printAttendance(ev: Ev) {
    const rows = attRows.length ? attRows : null;
    const html = `<!DOCTYPE html><html><head><title>Absensi - ${ev.title}</title>
      <style>body{font-family:sans-serif;padding:24px}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #888;padding:6px;font-size:12px}th{background:#eee}.meta{color:#555;font-size:13px}</style></head><body>
      <h1>DAFTAR HADIR</h1><p class="meta"><strong>${ev.title}</strong><br/>${ev.eventDate}${ev.eventTime ? " • " + ev.eventTime + " WIB" : ""}<br/>Lokasi: ${ev.location || "-"}</p>
      <table><thead><tr><th>No</th><th>Nama Warga</th><th>Alamat</th><th>Hadir</th><th>Tanda Tangan</th></tr></thead><tbody>
      ${(rows || []).map((c, i) => `<tr><td>${i + 1}</td><td>${c.name}</td><td>${c.address || "-"}</td><td></td><td></td></tr>`).join("")}
      </tbody></table><br/><p style="text-align:right">Pengurus RT/RW,<br/><br/><br/><br/>( ____________________ )</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Agenda & Kegiatan</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Tambah Agenda</button>
      </div>

      {showForm && (
        <div className="card border-blue-300">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600">Judul *</label>
              <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Tanggal *</label>
              <input required type="date" className="input-field" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Jam</label>
              <input type="time" className="input-field" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Lokasi</label>
              <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-gray-600">Deskripsi</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-1.5"><Save size={15} /> Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-1.5"><XCircle size={15} /> Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal absensi */}
      {attEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Absensi: {attEvent.title}</h3>
                <p className="text-xs text-gray-500">{attEvent.eventDate} • {attRows.filter((r) => r.present).length} dari {attRows.length} hadir</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printAttendance(attEvent)} className="btn-primary text-xs flex items-center gap-1.5"><Printer size={13} /> Cetak Absensi</button>
                <button onClick={() => setAttEvent(null)} className="p-2 bg-gray-200 rounded-lg"><X size={14} /></button>
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0"><tr className="table-header"><th className="p-2">Nama</th><th className="p-2">Alamat</th><th className="p-2 text-center">Hadir</th></tr></thead>
                <tbody>
                  {attRows.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="p-2 font-medium">{c.name}</td>
                      <td className="p-2 text-xs">{c.address || "-"}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => togglePresent(c.id, !c.present)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${c.present ? "bg-green-500 text-white" : "bg-gray-200 text-transparent"}`}>
                          <Check size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {events.map((ev) => {
          const upcoming = ev.eventDate >= new Date().toISOString().split("T")[0];
          return (
            <div key={ev.id} className={`card ${upcoming ? "border-blue-300 bg-blue-50" : ""}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-bold text-blue-700">
                    {new Date(ev.eventDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  {ev.eventTime && <div className="text-xs text-blue-500 flex items-center gap-1"><Clock size={11} /> {ev.eventTime} WIB</div>}
                  <h3 className="font-bold text-gray-800 mt-1">{ev.title}</h3>
                  {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
                  {ev.location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={11} /> {ev.location}</p>}
                  {ev.minutesUrl && (
                    <div className="text-xs text-gray-600 mt-2 border-t pt-2 flex items-start gap-1">
                      <FileText size={12} className="shrink-0 mt-0.5" /> <span className="whitespace-pre-wrap">{ev.minutesUrl}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={() => openAttendance(ev)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <Printer size={12} /> Absensi
                </button>
                <button onClick={() => saveNotulen(ev)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <FileText size={12} /> Notulen
                </button>
                <button onClick={() => remove(ev.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {events.length === 0 && <div className="card text-center py-8 text-gray-400">Belum ada agenda</div>}
    </div>
  );
}
