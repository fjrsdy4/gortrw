"use client";

import { useEffect, useState } from "react";
import { Megaphone, Siren, MoonStar, CreditCard, Copy, Send, MessageCircle, Smartphone } from "lucide-react";

interface Target { id: number; name: string; phone: string }

const TEMPLATES: Record<string, { label: string; icon: typeof Megaphone; text: string }> = {
  umum: {
    label: "Umum", icon: Megaphone,
    text: "*PENGUMUMAN RT/RW*\n\nAssalamualaikum Wr. Wb.\n\nKepada seluruh warga,\n\n[ISI PENGUMUMAN]\n\nDemikian, terima kasih atas perhatiannya.\n\nPengurus RT/RW",
  },
  ronda: {
    label: "Ronda", icon: MoonStar,
    text: "*JADWAL RONDA MALAM*\n\nPetugas ronda malam ini:\n[NAMA PETUGAS]\n\nWaktu: 22.00 - 04.00 WIB\nPos: Pos Ronda RT\n\nMohon hadir tepat waktu. Terima kasih.",
  },
  bencana: {
    label: "Darurat/Siaga", icon: Siren,
    text: "*PERINGATAN DARURAT*\n\n*[JENIS PERINGATAN]*\n\nKepada seluruh warga:\n[INSTRUKSI KESELAMATAN]\n\nKontak darurat: [NOMOR]\n\nTetap tenang dan waspada. Keselamatan adalah prioritas.",
  },
  iuran: {
    label: "Iuran", icon: CreditCard,
    text: "*PENGINGAT IURAN*\n\nKepada seluruh warga,\n\nDiingatkan pembayaran iuran bulanan:\nBatas: tanggal 15\nJumlah: [JUMLAH]\n\nPembayaran ke bendahara RT.\nTerima kasih atas kontribusinya!",
  },
};

export default function BroadcastPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [message, setMessage] = useState(TEMPLATES.umum.text);
  const [selected, setSelected] = useState("umum");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/citizens?status=aktif&search=").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setTargets(d.filter((c: Target & { phone?: string }) => c.phone));
    }).catch(() => {});
  }, []);

  function copy() {
    navigator.clipboard?.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wa = (p: string) => p.replace(/\D/g, "").replace(/^0/, "62");

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Smartphone className="text-blue-600" size={20} /> Pusat Broadcast WhatsApp
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} onClick={() => { setSelected(key); setMessage(t.text); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                selected === key ? (key === "bencana" ? "bg-red-600 text-white" : "bg-blue-600 text-white") : "bg-gray-100 hover:bg-gray-200"
              }`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <textarea className="input-field" rows={9} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tulis pesan broadcast..." />
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={copy} className="btn-primary flex items-center gap-1.5">
            <Copy size={15} /> {copied ? "Tersalin!" : "Salin Teks"}
          </button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")}
            disabled={!message} className="btn-success flex items-center gap-1.5 disabled:opacity-50">
            <Send size={15} /> Buka WhatsApp (grup)
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-800 mb-1">Kirim Pesan Berantai Personal</h3>
        <p className="text-sm text-gray-500 mb-3">Klik nama warga untuk mengirim pesan di atas langsung ke WhatsApp pribadinya.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {targets.map((t) => (
            <button key={t.id} disabled={!message}
              onClick={() => window.open(`https://wa.me/${wa(t.phone)}?text=${encodeURIComponent(message)}`, "_blank")}
              className="text-left p-2.5 rounded-lg border hover:bg-green-50 hover:border-green-300 transition text-sm disabled:opacity-50">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-0.5"><MessageCircle size={11} /> {t.phone}</div>
            </button>
          ))}
        </div>
        {targets.length === 0 && <p className="text-gray-400 text-sm">Tidak ada warga dengan nomor WA terdaftar</p>}
      </div>
    </div>
  );
}
