import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  serial,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("user_role", ["admin", "staff", "bendahara"]);
export const genderEnum = pgEnum("gender", ["L", "P"]);
export const maritalEnum = pgEnum("marital_status", [
  "Belum Menikah",
  "Sudah Menikah",
  "Cerai Hidup",
  "Cerai Mati",
]);
export const religionEnum = pgEnum("religion", [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
]);
export const citizenStatusEnum = pgEnum("citizen_status", [
  "aktif",
  "pindah",
  "meninggal",
]);
export const letterStatusEnum = pgEnum("letter_status", [
  "pending",
  "proses",
  "selesai",
  "ditolak",
]);
export const complaintStatusEnum = pgEnum("complaint_status", [
  "baru",
  "proses",
  "selesai",
]);
export const assetConditionEnum = pgEnum("asset_condition", [
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
]);
export const borrowStatusEnum = pgEnum("borrow_status", [
  "pending",
  "disetujui",
  "ditolak",
  "dikembalikan",
]);
export const txTypeEnum = pgEnum("tx_type", ["masuk", "keluar"]);

// Users (admin/staff/bendahara)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: roleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Families (KK)
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  noKK: varchar("no_kk", { length: 20 }).notNull().unique(),
  headName: varchar("head_name", { length: 200 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Citizens (Warga)
export const citizens = pgTable("citizens", {
  id: serial("id").primaryKey(),
  nik: varchar("nik", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  gender: genderEnum("gender").notNull(),
  birthPlace: varchar("birth_place", { length: 100 }),
  birthDate: date("birth_date"),
  religion: religionEnum("religion"),
  maritalStatus: maritalEnum("marital_status"),
  occupation: varchar("occupation", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  rt: varchar("rt", { length: 5 }),
  rw: varchar("rw", { length: 5 }),
  familyId: integer("family_id").references(() => families.id),
  familyRelation: varchar("family_relation", { length: 50 }),
  status: citizenStatusEnum("status").notNull().default("aktif"),
  statusDate: date("status_date"),
  statusNote: text("status_note"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events / Agenda
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  eventTime: varchar("event_time", { length: 10 }),
  location: varchar("location", { length: 200 }),
  minutesUrl: text("minutes_url"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .references(() => events.id)
    .notNull(),
  citizenId: integer("citizen_id")
    .references(() => citizens.id)
    .notNull(),
  present: boolean("present").default(false),
});

// Financial Transactions (Arus Kas)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txId: varchar("tx_id", { length: 30 }).notNull().unique(),
  txType: txTypeEnum("tx_type").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  txDate: date("tx_date").notNull(),
  proofUrl: text("proof_url"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dues / Iuran Types
export const dueTypes = pgTable("due_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
});

// Dues Payments (Ceklis Iuran)
export const duePayments = pgTable("due_payments", {
  id: serial("id").primaryKey(),
  citizenId: integer("citizen_id")
    .references(() => citizens.id)
    .notNull(),
  dueTypeId: integer("due_type_id")
    .references(() => dueTypes.id)
    .notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  paid: boolean("paid").default(false),
  paidDate: date("paid_date"),
  transactionId: integer("transaction_id").references(() => transactions.id),
  proofUrl: text("proof_url"),
});

// Assets
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").default(1),
  condition: assetConditionEnum("condition").default("Baik"),
  location: varchar("location", { length: 200 }),
  photoUrl: text("photo_url"),
  isBorrowable: boolean("is_borrowable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Asset Borrows
export const assetBorrows = pgTable("asset_borrows", {
  id: serial("id").primaryKey(),
  ticketNo: varchar("ticket_no", { length: 30 }).notNull().unique(),
  assetId: integer("asset_id")
    .references(() => assets.id)
    .notNull(),
  borrowerName: varchar("borrower_name", { length: 200 }).notNull(),
  borrowerPhone: varchar("borrower_phone", { length: 20 }),
  borrowDate: date("borrow_date").notNull(),
  returnDate: date("return_date"),
  actualReturnDate: date("actual_return_date"),
  status: borrowStatusEnum("status").default("pending"),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Letter Requests (Permohonan Surat)
export const letterRequests = pgTable("letter_requests", {
  id: serial("id").primaryKey(),
  ticketNo: varchar("ticket_no", { length: 30 }).notNull().unique(),
  requesterName: varchar("requester_name", { length: 200 }).notNull(),
  requesterPhone: varchar("requester_phone", { length: 20 }),
  letterType: varchar("letter_type", { length: 100 }).notNull(),
  purpose: text("purpose"),
  status: letterStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaints (Pengaduan)
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  ticketNo: varchar("ticket_no", { length: 30 }).notNull().unique(),
  reporterName: varchar("reporter_name", { length: 200 }),
  isAnonymous: boolean("is_anonymous").default(false),
  category: varchar("category", { length: 100 }),
  content: text("content").notNull(),
  status: complaintStatusEnum("status").default("baru"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// UMKM Products
export const umkmProducts = pgTable("umkm_products", {
  id: serial("id").primaryKey(),
  citizenId: integer("citizen_id").references(() => citizens.id),
  productName: varchar("product_name", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 15, scale: 2 }),
  photoUrl: text("photo_url"),
  whatsapp: varchar("whatsapp", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications (Bell)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  refId: integer("ref_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Log (Audit)
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 200 }).notNull(),
  detail: text("detail"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});
