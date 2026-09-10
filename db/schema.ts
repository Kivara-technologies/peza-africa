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
  preferredLanguage: text("preferred_language").notNull().default("en"), // en | bem | nya
  role: text("role").notNull().default("customer"), // "customer" | "admin" | "rider"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Rider locations ──────────────────────────────────────────────────
// One row per rider, upserted on every location ping while they're online.
// Deliberately a separate table from profiles — see migration 0008 for why.
export const riderLocations = pgTable("rider_locations", {
  riderId: uuid("rider_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  lat: numeric("lat").notNull(),
  lng: numeric("lng").notNull(),
  isOnline: boolean("is_online").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  vendorId: uuid("vendor_id").references(() => profiles.id), // owning seller, null = platform-seeded
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
  paymentMethod: text("payment_method").notNull(), // AIRTEL | MTN | ZAMTEL | WALLET
  paymentReference: text("payment_reference"), // provider transaction ref, set once a webhook confirms payment
  deliveryAddress: text("delivery_address").notNull().default(""),
  deliveryPhone: text("delivery_phone").notNull().default(""),
  deliveryLat: numeric("delivery_lat"),
  deliveryLng: numeric("delivery_lng"),
  riderId: uuid("rider_id").references(() => profiles.id), // assigned once a rider claims the delivery
  status: text("status").notNull().default("pending"), // pending|paid|processing|shipped|delivered|cancelled — "shipped" doubles as "out for delivery"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull(),
  total: numeric("total").notNull(),
});

// ── Wallet ───────────────────────────────────────────────────────────
// status gates whether a transaction counts toward the balance: a top-up
// starts "pending" and only becomes "completed" once the mobile money
// provider's webhook confirms the charge actually happened. Never flip this
// to "completed" from a user-facing mutation.
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  amount: numeric("amount").notNull(), // positive = credit, negative = debit
  type: text("type").notNull(), // "topup" | "payment" | "refund" | "payout"
  status: text("status").notNull().default("completed"), // "pending" | "completed" | "failed"
  provider: text("provider"), // Airtel Money | MTN MoMo | Zamtel Kwacha
  providerReference: text("provider_reference"), // provider's transaction id, for webhook reconciliation
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

export const infobipMessages = pgTable("infobip_messages", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().default("infobip"),
  channel: text("channel").notNull().default("sms"), // sms | whatsapp
  direction: text("direction").notNull().default("inbound"), // inbound | outbound
  sender: text("sender"),
  recipient: text("recipient"),
  externalId: text("external_id"),
  body: text("body").notNull(),
  status: text("status").notNull().default("received"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Chilimba (rotating savings circles) ─────────────────────────────
// A group of members each contribute a fixed amount per round; the full
// pot is paid out to one member per round, in join order, until every
// member has been paid once. Money only ever moves between members'
// existing wallet balances (wallet_transactions) — Chilimba never
// creates or destroys money on its own.
export const chilimbaCircles = pgTable("chilimba_circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contributionAmount: numeric("contribution_amount").notNull(),
  frequencyDays: integer("frequency_days").notNull().default(7), // 7 = weekly, 30 = monthly
  maxMembers: integer("max_members").notNull(),
  creatorId: uuid("creator_id").notNull().references(() => profiles.id),
  status: text("status").notNull().default("recruiting"), // recruiting | active | completed
  currentRound: integer("current_round").notNull().default(0), // 0 until full and active
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chilimbaMembers = pgTable("chilimba_members", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => chilimbaCircles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  payoutPosition: integer("payout_position").notNull(), // join order = payout order, 1-indexed
  hasBeenPaid: boolean("has_been_paid").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const chilimbaContributions = pgTable("chilimba_contributions", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => chilimbaCircles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  round: integer("round").notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Admin audit log ──────────────────────────────────────────────────
// Minimal (actor, action, target, detail) trail. Written by admin-only
// mutations (order.confirmOrder, rider.becomeRider, product create) so
// there's a record of who did what, per the P2 audit item.
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id").notNull().references(() => profiles.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chilimbaPayouts = pgTable("chilimba_payouts", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => chilimbaCircles.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  recipientId: uuid("recipient_id").notNull().references(() => profiles.id),
  amount: numeric("amount").notNull(),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
});
