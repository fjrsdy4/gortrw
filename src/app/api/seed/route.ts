// Vercel Serverless Function: POST /api/seed — Inisialisasi data demo (sekali jalan)
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, announcements, events, assets, dueTypes, citizens, families, transactions, umkmProducts } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) return NextResponse.json({ message: "Already seeded" });

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

    return NextResponse.json({ message: "Seeded successfully" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
