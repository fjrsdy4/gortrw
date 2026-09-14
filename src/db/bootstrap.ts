// Auto-bootstrap database: membuat seluruh tabel & enum (idempotent) lalu mengisi
// data demo bila kosong. Dipanggil otomatis oleh endpoint login/seed/stats agar
// aplikasi langsung jalan di Vercel tanpa menjalankan drizzle-kit push manual.
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { users, announcements, events, assets, dueTypes, citizens, families, transactions, umkmProducts } from "@/db/schema";
import bcrypt from "bcryptjs";

const BOOTSTRAP_SQL = `
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin','staff','bendahara'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE gender AS ENUM ('L','P'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE marital_status AS ENUM ('Belum Menikah','Sudah Menikah','Cerai Hidup','Cerai Mati'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE religion AS ENUM ('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE citizen_status AS ENUM ('aktif','pindah','meninggal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE letter_status AS ENUM ('pending','proses','selesai','ditolak'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE complaint_status AS ENUM ('baru','proses','selesai'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE asset_condition AS ENUM ('Baik','Rusak Ringan','Rusak Berat'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE borrow_status AS ENUM ('pending','disetujui','ditolak','dikembalikan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tx_type AS ENUM ('masuk','keluar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY, username varchar(100) NOT NULL UNIQUE, password_hash text NOT NULL,
  name varchar(200) NOT NULL, role user_role NOT NULL DEFAULT 'staff', created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS families (
  id serial PRIMARY KEY, no_kk varchar(20) NOT NULL UNIQUE, head_name varchar(200) NOT NULL,
  address text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS citizens (
  id serial PRIMARY KEY, nik varchar(20) NOT NULL UNIQUE, name varchar(200) NOT NULL,
  gender gender NOT NULL, birth_place varchar(100), birth_date date, religion religion,
  marital_status marital_status, occupation varchar(100), phone varchar(20), address text,
  rt varchar(5), rw varchar(5), family_id integer REFERENCES families(id), family_relation varchar(50),
  status citizen_status NOT NULL DEFAULT 'aktif', status_date date, status_note text,
  photo_url text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS announcements (
  id serial PRIMARY KEY, title varchar(300) NOT NULL, content text NOT NULL, is_pinned boolean DEFAULT false,
  created_by integer REFERENCES users(id), created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY, title varchar(300) NOT NULL, description text, event_date date NOT NULL,
  event_time varchar(10), location varchar(200), minutes_url text,
  created_by integer REFERENCES users(id), created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendance (
  id serial PRIMARY KEY, event_id integer NOT NULL REFERENCES events(id),
  citizen_id integer NOT NULL REFERENCES citizens(id), present boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS transactions (
  id serial PRIMARY KEY, tx_id varchar(30) NOT NULL UNIQUE, tx_type tx_type NOT NULL,
  category varchar(100) NOT NULL, description text, amount numeric(15,2) NOT NULL, tx_date date NOT NULL,
  proof_url text, created_by integer REFERENCES users(id), created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS due_types (
  id serial PRIMARY KEY, name varchar(100) NOT NULL, amount numeric(15,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS due_payments (
  id serial PRIMARY KEY, citizen_id integer NOT NULL REFERENCES citizens(id),
  due_type_id integer NOT NULL REFERENCES due_types(id), month integer NOT NULL, year integer NOT NULL,
  paid boolean DEFAULT false, paid_date date, transaction_id integer REFERENCES transactions(id), proof_url text
);
CREATE TABLE IF NOT EXISTS assets (
  id serial PRIMARY KEY, name varchar(200) NOT NULL, description text, quantity integer DEFAULT 1,
  condition asset_condition DEFAULT 'Baik', location varchar(200), photo_url text,
  is_borrowable boolean DEFAULT true, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS asset_borrows (
  id serial PRIMARY KEY, ticket_no varchar(30) NOT NULL UNIQUE, asset_id integer NOT NULL REFERENCES assets(id),
  borrower_name varchar(200) NOT NULL, borrower_phone varchar(20), borrow_date date NOT NULL, return_date date,
  actual_return_date date, status borrow_status DEFAULT 'pending', purpose text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS letter_requests (
  id serial PRIMARY KEY, ticket_no varchar(30) NOT NULL UNIQUE, requester_name varchar(200) NOT NULL,
  requester_phone varchar(20), letter_type varchar(100) NOT NULL, purpose text,
  status letter_status DEFAULT 'pending', notes text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS complaints (
  id serial PRIMARY KEY, ticket_no varchar(30) NOT NULL UNIQUE, reporter_name varchar(200),
  is_anonymous boolean DEFAULT false, category varchar(100), content text NOT NULL,
  status complaint_status DEFAULT 'baru', response text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS umkm_products (
  id serial PRIMARY KEY, citizen_id integer REFERENCES citizens(id), product_name varchar(200) NOT NULL,
  description text, price numeric(15,2), photo_url text, whatsapp varchar(20),
  is_active boolean DEFAULT true, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY, title varchar(300) NOT NULL, message text, type varchar(50),
  ref_id integer, is_read boolean DEFAULT false, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id serial PRIMARY KEY, user_id integer REFERENCES users(id), action varchar(200) NOT NULL,
  detail text, ip_address varchar(50), created_at timestamp DEFAULT now()
);
`;

let ensuredThisInstance = false;

/** Membuat tabel bila belum ada, lalu seed data demo bila kosong. Aman dipanggil berkali-kali. */
export async function ensureDatabase(): Promise<void> {
  if (ensuredThisInstance) return;
  // Menjalankan SQL bootstrap lewat Drizzle (tanpa bergantung pada export pool tertentu).
  await db.execute(sql.raw(BOOTSTRAP_SQL));
  await seedIfEmpty();
  ensuredThisInstance = true;
}

export async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return { seeded: false };

  await db.insert(users).values([
    { username: "admin", passwordHash: await bcrypt.hash("admin123", 10), name: "Ketua RT", role: "admin" },
    { username: "staff", passwordHash: await bcrypt.hash("staff123", 10), name: "Sekretaris RT", role: "staff" },
    { username: "bendahara", passwordHash: await bcrypt.hash("bendahara123", 10), name: "Bendahara RT", role: "bendahara" },
  ]);

  const fams = await db.insert(families).values([
    { noKK: "3201010101010001", headName: "Ahmad Suryadi", address: "Jl. Mawar No. 1 RT 001/RW 002" },
    { noKK: "3201010101010002", headName: "Budi Santoso", address: "Jl. Mawar No. 2 RT 001/RW 002" },
    { noKK: "3201010101010003", headName: "Siti Nurhaliza", address: "Jl. Melati No. 3 RT 001/RW 002" },
  ]).returning();

  await db.insert(citizens).values([
    { nik: "3201010101900001", name: "Ahmad Suryadi", gender: "L", birthPlace: "Bogor", birthDate: "1990-05-15", religion: "Islam", maritalStatus: "Sudah Menikah", occupation: "Wiraswasta", phone: "08123456789", address: "Jl. Mawar No. 1", rt: "001", rw: "002", familyId: fams[0].id, familyRelation: "Kepala Keluarga" },
    { nik: "3201010101920002", name: "Dewi Lestari", gender: "P", birthPlace: "Jakarta", birthDate: "1992-08-20", religion: "Islam", maritalStatus: "Sudah Menikah", occupation: "Ibu Rumah Tangga", phone: "08123456790", address: "Jl. Mawar No. 1", rt: "001", rw: "002", familyId: fams[0].id, familyRelation: "Istri" },
    { nik: "3201010101150003", name: "Rafi Ahmad", gender: "L", birthPlace: "Bogor", birthDate: "2015-03-10", religion: "Islam", maritalStatus: "Belum Menikah", occupation: "Pelajar", address: "Jl. Mawar No. 1", rt: "001", rw: "002", familyId: fams[0].id, familyRelation: "Anak" },
    { nik: "3201010101850004", name: "Budi Santoso", gender: "L", birthPlace: "Bandung", birthDate: "1985-12-01", religion: "Kristen", maritalStatus: "Sudah Menikah", occupation: "PNS", phone: "08567890123", address: "Jl. Mawar No. 2", rt: "001", rw: "002", familyId: fams[1].id, familyRelation: "Kepala Keluarga" },
    { nik: "3201010101600005", name: "Siti Nurhaliza", gender: "P", birthPlace: "Surabaya", birthDate: "1960-07-22", religion: "Islam", maritalStatus: "Cerai Mati", occupation: "Pensiunan", phone: "08901234567", address: "Jl. Melati No. 3", rt: "001", rw: "002", familyId: fams[2].id, familyRelation: "Kepala Keluarga" },
    { nik: "3201010101000006", name: "Andi Pratama", gender: "L", birthPlace: "Bogor", birthDate: "2000-01-15", religion: "Hindu", maritalStatus: "Belum Menikah", occupation: "Mahasiswa", phone: "08112233445", address: "Jl. Kenanga No. 4", rt: "001", rw: "002" },
    { nik: "3201010101750007", name: "Sri Wahyuni", gender: "P", birthPlace: "Yogyakarta", birthDate: "1975-11-30", religion: "Buddha", maritalStatus: "Sudah Menikah", occupation: "Guru", phone: "08556677889", address: "Jl. Dahlia No. 5", rt: "001", rw: "002" },
  ]);

  await db.insert(announcements).values([
    { title: "Jadwal Kerja Bakti Bulanan", content: "Kerja bakti akan dilaksanakan pada hari Minggu, pukul 07.00 WIB. Seluruh warga diharapkan ikut berpartisipasi membersihkan lingkungan RT.", isPinned: true, createdBy: 1 },
    { title: "Pembayaran Iuran Bulan Ini", content: "Diingatkan kepada seluruh warga untuk membayar iuran bulanan paling lambat tanggal 15. Pembayaran bisa melalui bendahara RT atau transfer.", isPinned: false, createdBy: 1 },
    { title: "Open Recruitment Pengurus Pemuda", content: "Bagi warga usia 17-30 tahun yang ingin bergabung dalam kegiatan kepemudaan RT, silakan daftar ke sekretaris.", isPinned: false, createdBy: 1 },
  ]);

  await db.insert(events).values([
    { title: "Rapat Koordinasi Warga", description: "Rapat koordinasi membahas program kerja semester 2", eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], eventTime: "19:00", location: "Balai RT", createdBy: 1 },
    { title: "Posyandu Balita", description: "Penimbangan dan imunisasi rutin balita", eventDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0], eventTime: "08:00", location: "Pos RT", createdBy: 1 },
    { title: "Kerja Bakti", description: "Membersihkan selokan dan lingkungan", eventDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0], eventTime: "07:00", location: "Lingkungan RT", createdBy: 1 },
  ]);

  await db.insert(assets).values([
    { name: "Tenda Pesta", description: "Tenda ukuran 4x6 meter, warna putih", quantity: 2, condition: "Baik", location: "Gudang RT", isBorrowable: true },
    { name: "Kursi Lipat", description: "Kursi lipat plastik putih", quantity: 50, condition: "Baik", location: "Gudang RT", isBorrowable: true },
    { name: "Sound System", description: "Sound system portable dengan mic wireless", quantity: 1, condition: "Baik", location: "Pos RT", isBorrowable: true },
    { name: "Gerobak Sampah", description: "Gerobak untuk pengangkutan sampah", quantity: 2, condition: "Rusak Ringan", location: "Depan Pos RT", isBorrowable: false },
  ]);

  await db.insert(dueTypes).values([
    { name: "Iuran Bulanan", amount: "50000" },
    { name: "Iuran Kebersihan", amount: "25000" },
    { name: "Iuran Keamanan", amount: "30000" },
  ]);

  await db.insert(transactions).values([
    { txId: "TRX-20250701-A1B2C3", txType: "masuk", category: "Iuran Bulanan", description: "Iuran bulan Juli - Ahmad Suryadi", amount: "50000", txDate: "2025-07-01", createdBy: 3 },
    { txId: "TRX-20250702-D4E5F6", txType: "masuk", category: "Iuran Bulanan", description: "Iuran bulan Juli - Budi Santoso", amount: "50000", txDate: "2025-07-02", createdBy: 3 },
    { txId: "TRX-20250703-G7H8I9", txType: "keluar", category: "Operasional", description: "Pembelian lampu jalan", amount: "150000", txDate: "2025-07-03", createdBy: 3 },
    { txId: "TRX-20250705-J1K2L3", txType: "keluar", category: "Kebersihan", description: "Pembelian sapu dan alat kebersihan", amount: "75000", txDate: "2025-07-05", createdBy: 3 },
    { txId: "TRX-20250710-M4N5O6", txType: "masuk", category: "Sumbangan", description: "Sumbangan warga untuk HUT RI", amount: "500000", txDate: "2025-07-10", createdBy: 3 },
  ]);

  await db.insert(umkmProducts).values([
    { productName: "Keripik Singkong Bu Dewi", description: "Keripik singkong renyah berbagai rasa: original, balado, keju", price: "15000", whatsapp: "08123456790", isActive: true },
    { productName: "Kue Basah Ibu Sri", description: "Aneka kue basah tradisional: lemper, klepon, onde-onde. Pesanan min H-1", price: "5000", whatsapp: "08556677889", isActive: true },
  ]);

  return { seeded: true };
}
