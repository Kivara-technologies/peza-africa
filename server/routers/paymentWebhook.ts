import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { and, eq, like, or, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";

function secretsMatch(provided: string | undefined | null, expected: string): boolean {
  if (!provided) return false;
  const providedBuf = Buffer.from(provided); const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}
export const paymentWebhookRoutes = new Hono();
const PROVIDER_SECRET_ENV: Record<string, string> = { "Airtel Money": "AIRTEL_WEBHOOK_SECRET", "MTN MoMo": "MTN_WEBHOOK_SECRET", "Zamtel Kwacha": "ZAMTEL_WEBHOOK_SECRET", "Infobip": "INFOBIP_WEBHOOK_SECRET" };
const SHOP_TRIGGER_WORDS = ["shop", "peza", "menu", "buy", "catalog", "hello"];

export function parseCategorySelection(raw: string, categories: Array<{ slug: string; name: string }>) {
  const trimmed = raw.trim().toLowerCase(); if (!trimmed) return null;
  const exactCategory = categories.find((category) => category.name.toLowerCase() === trimmed || category.slug.toLowerCase() === trimmed);
  if (exactCategory) return exactCategory.slug;
  const numericIndex = Number(trimmed); if (!Number.isNaN(numericIndex) && numericIndex > 0) return categories[numericIndex - 1]?.slug ?? null;
  return null;
}
export function buildInfobipReply(raw: string, categories: Array<{ slug: string; name: string }>, products: Array<{ name: string; price: string; categorySlug: string | null }>) {
  const input = (raw ?? "").trim(); const normalized = input.toLowerCase();
  const buyMatch = normalized.match(/^buy\s+(.+)$/);
  if (buyMatch) { const matches = products.filter((product) => product.name.toLowerCase().includes(buyMatch[1].trim())); if (matches.length > 0) { const topMatch = matches[0]; return [`${topMatch.name}`, `Price: K${Number(topMatch.price).toLocaleString()}`, "To order, reply with: BUY " + topMatch.name, "Cash on delivery is available in local areas."].join("\n"); } }
  if (!input || SHOP_TRIGGER_WORDS.some((word) => normalized === word || normalized.startsWith(`${word} `))) { const list = categories.length ? categories.map((category, index) => `${index + 1}. ${category.name}`).join("\n") : "No categories available yet."; return ["PEZA Store", "Reply with a category number to browse products.", list, "Example: 1", "Or send a product name like: rice"].join("\n"); }
  const selectedCategorySlug = parseCategorySelection(input, categories);
  if (selectedCategorySlug) { const categoryProducts = products.filter((product) => (product.categorySlug ?? "") === selectedCategorySlug); if (categoryProducts.length === 0) return "No products are available in this category yet. Reply with another category number or send a product name like rice."; return [`Products in ${categories.find((c) => c.slug === selectedCategorySlug)?.name ?? selectedCategorySlug}:`, ...categoryProducts.slice(0, 5).map((product) => `${product.name} - K${Number(product.price).toLocaleString()}`), "Reply with the exact product name to buy it, or send MENU to see categories again."].join("\n"); }
  const matches = products.filter((product) => product.name.toLowerCase().includes(normalized));
  if (matches.length > 0) { const topMatch = matches[0]; return [`${topMatch.name}`, `Price: K${Number(topMatch.price).toLocaleString()}`, "To order, reply with: BUY " + topMatch.name, "Cash on delivery is available in local areas."].join("\n"); }
  return "I did not recognize that request. Reply MENU to see the store categories or send a product name like rice.";
}

async function processInfobipInboundMessage(body: any) {
  const text = String(body?.text ?? body?.message?.text ?? "").trim(); const sender = String(body?.from ?? body?.sender ?? body?.msisdn ?? ""); const channel = String(body?.channel ?? body?.message?.type ?? "sms").toLowerCase(); const payload = body ?? {};
  if (!text) return { ok: false, error: "Missing text body" };
  const categories = await db.select().from(schema.categories).orderBy(schema.categories.name);
  const products = await db.select({ id: schema.products.id, name: schema.products.name, price: schema.products.price, categorySlug: schema.products.categorySlug }).from(schema.products).where(or(like(schema.products.name, `%${text}%`), like(schema.products.description, `%${text}%`))).limit(20);
  const fallbackProducts = await db.select({ id: schema.products.id, name: schema.products.name, price: schema.products.price, categorySlug: schema.products.categorySlug }).from(schema.products).limit(25);
  const replyText = buildInfobipReply(text, categories, products.length > 0 ? products : fallbackProducts);
  await db.insert(schema.infobipMessages).values({ provider: "infobip", channel, direction: "inbound", sender: sender || null, recipient: "storefront", body: text, status: "received", payload });
  return { ok: true, replyText, channel, sender };
}

paymentWebhookRoutes.post("/mobile-money", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.provider || !body?.reference || !body?.status) return c.json({ error: "Malformed payload — expected provider, reference and status" }, 400);
  const secretEnvKey = PROVIDER_SECRET_ENV[body.provider]; const configuredSecret = secretEnvKey ? process.env[secretEnvKey] : undefined;
  if (!configuredSecret) return c.json({ error: `${body.provider} webhook is not configured yet` }, 501);
  const providedSecret = c.req.header("x-webhook-secret"); if (!secretsMatch(providedSecret, configuredSecret)) return c.json({ error: "Invalid signature" }, 401);

  const reference = String(body.reference);
  // Marketplace mobile-money checkout reserves inventory while the order is pending.
  // Settle the state transition and, on a provider failure, release that reservation in
  // the same database transaction. The pending -> terminal-state conditional update is
  // the idempotency guard: duplicate callbacks cannot restore stock twice.
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.paymentReference, reference)).limit(1);
  if (order) {
    if (order.paymentMethod !== "AIRTEL" && order.paymentMethod !== "MTN" && order.paymentMethod !== "ZAMTEL") return c.json({ error: "Payment reference is not a mobile-money order" }, 400);
    if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") return c.json({ ok: true, note: "order already settled" });
    const succeeded = String(body.status).toUpperCase() === "SUCCESS";
    const nextStatus = succeeded ? "processing" : "failed";

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(schema.orders)
        .set({ status: nextStatus })
        .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending")))
        .returning();

      if (!updated) return { updated: false as const };

      if (!succeeded) {
        const items = await tx.select({ productId: schema.orderItems.productId, quantity: schema.orderItems.quantity })
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        for (const item of items) {
          await tx.update(schema.products)
            .set({ stock: sql`${schema.products.stock} + ${item.quantity}` })
            .where(eq(schema.products.id, item.productId));
        }
      } else {
        await tx.insert(schema.notifications).values({
          userId: order.userId,
          type: "order",
          title: "Payment confirmed",
          message: `Payment for order ${order.orderNumber} has been confirmed. It's ready for delivery.`,
        });
      }

      return { updated: true as const, status: updated.status };
    });

    return c.json({ ok: true, orderId: order.id, status: result.status ?? order.status, alreadySettled: !result.updated });
  }

  // Backward-compatible wallet transaction path for provider callbacks created by older integrations.
  if (!body.externalId) return c.json({ error: "No matching payment order" }, 404);
  const txId = Number(body.externalId);
  const [alreadyProcessed] = await db.select({ id: schema.walletTransactions.id }).from(schema.walletTransactions).where(eq(schema.walletTransactions.providerReference, reference)).limit(1);
  if (alreadyProcessed) return c.json({ ok: true, note: "already processed" });
  const [existing] = await db.select().from(schema.walletTransactions).where(and(eq(schema.walletTransactions.id, txId), eq(schema.walletTransactions.status, "pending"))).limit(1);
  if (!existing) return c.json({ error: "No matching pending transaction" }, 404);
  await db.update(schema.walletTransactions).set({ status: String(body.status).toUpperCase() === "SUCCESS" ? "completed" : "failed", providerReference: reference }).where(eq(schema.walletTransactions.id, txId));
  return c.json({ ok: true });
});

paymentWebhookRoutes.post("/infobip/sms", async (c) => {
  const body = await c.req.json().catch(() => null); if (!body) return c.json({ error: "No payload provided" }, 400);
  const secret = process.env.INFOBIP_WEBHOOK_SECRET; if (!secret) return c.json({ error: "Infobip webhook is not configured yet" }, 503);
  const providedSecret = c.req.header("x-webhook-secret") || c.req.header("x-infobip-signature"); if (!secretsMatch(providedSecret, secret)) return c.json({ error: "Invalid signature" }, 401);
  const result = await processInfobipInboundMessage({ ...body, channel: "sms" }); return c.json({ ok: result.ok, replyText: result.replyText, channel: result.channel, sender: result.sender });
});
paymentWebhookRoutes.post("/infobip/whatsapp", async (c) => {
  const body = await c.req.json().catch(() => null); if (!body) return c.json({ error: "No payload provided" }, 400);
  const secret = process.env.INFOBIP_WEBHOOK_SECRET; if (!secret) return c.json({ error: "Infobip webhook is not configured yet" }, 503);
  const providedSecret = c.req.header("x-webhook-secret") || c.req.header("x-infobip-signature"); if (!secretsMatch(providedSecret, secret)) return c.json({ error: "Invalid signature" }, 401);
  const result = await processInfobipInboundMessage({ ...body, channel: "whatsapp" }); return c.json({ ok: result.ok, replyText: result.replyText, channel: result.channel, sender: result.sender });
});
paymentWebhookRoutes.get("/infobip/test", async (c) => {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") return c.json({ error: "Not available in production" }, 404);
  const categories = await db.select().from(schema.categories).orderBy(schema.categories.name); const products = await db.select({ name: schema.products.name, price: schema.products.price, categorySlug: schema.products.categorySlug }).from(schema.products).limit(5);
  return c.json({ sample: buildInfobipReply("menu", categories, products), categoriesCount: categories.length, productsCount: products.length });
});
