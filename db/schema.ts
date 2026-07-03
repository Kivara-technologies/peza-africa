import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Profiles ─────────────────────────────────────────────────────────
// One row per Supabase Auth user (id matches auth.users.id).
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // == auth.users.id
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // "customer" | "admin"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Catalog ──────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  image: text("image"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  price: numeric("price").notNull(),
  comparePrice: numeric("compare_price"),
  image: text("image").notNull(),
  realPhoto: text("real_photo"),
  categoryId: integer("category_id").references(() => categories.id),
  categorySlug: text("category_slug"), // denormalized for fast filtering
  vendor: text("vendor").notNull().default("PEZA Marketplace"),
  rating: numeric("rating").notNull().default("4.5"),
  reviewCount: integer("review_count").notNull().default(0),
  whatsappNumber: text("whatsapp_number"),
  laybyMonths: integer("layby_months"),
  featured: boolean("featured").notNull().default(false),
  isDeal: boolean("is_deal").notNull().default(false),
  stock: integer("stock").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Orders ───────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  orderNumber: text("order_number").notNull().unique(),
  subtotal: numeric("subtotal").notNull(),
  shipping: numeric("shipping").notNull(),
  discount: numeric("discount").notNull().default("0"),
  total: numeric("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"), // pending|processing|shipped|delivered|cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull(),
  total: numeric("total").notNull(),
});

// ── Wallet ───────────────────────────────────────────────────────────
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  amount: numeric("amount").notNull(), // positive = credit, negative = debit
  type: text("type").notNull(), // "topup" | "payment" | "refund"
  provider: text("provider"), // M-Pesa | Airtel | MTN
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Suppliers ────────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image"),
  city: text("city").notNull(),
  country: text("country").notNull(),
  verified: boolean("verified").notNull().default(false),
  rating: numeric("rating").notNull().default("4.5"),
  description: text("description"),
  minOrder: text("min_order"),
  leadTime: text("lead_time"),
  category: text("category").notNull().default("All"),
});

// ── Market prices ────────────────────────────────────────────────────
export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // commodities | fuel | currency
  item: text("item").notNull(),
  price: text("price").notNull(),
  change: text("change").notNull().default("0%"),
  isUp: boolean("is_up"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Jobs ─────────────────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // Full-time | Part-time | Contract
  salary: text("salary").notNull(),
  description: text("description"),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  urgent: boolean("urgent").notNull().default(false),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  coverLetter: text("cover_letter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Chat ─────────────────────────────────────────────────────────────
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  avatar: text("avatar").notNull().default("S"),
  lastMsg: text("last_msg").notNull().default(""),
  unread: integer("unread").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isOutgoing: boolean("is_outgoing").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Notifications ────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  type: text("type").notNull().default("info"), // order|promo|payment|job|info
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
