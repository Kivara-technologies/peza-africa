import { Hono } from "hono";
import { and, eq, like, or } from "drizzle-orm";
import { db, schema } from "../../db/index.js";

export const paymentWebhookRoutes = new Hono();

const PROVIDER_SECRET_ENV: Record<string, string> = {
  "Airtel Money": "AIRTEL_WEBHOOK_SECRET",
  "MTN MoMo": "MTN_WEBHOOK_SECRET",
  "Zamtel Kwacha": "ZAMTEL_WEBHOOK_SECRET",
  "Infobip": "INFOBIP_WEBHOOK_SECRET",
};

const SHOP_TRIGGER_WORDS = ["shop", "peza", "menu", "buy", "catalog", "hello"];

export function parseCategorySelection(raw: string, categories: Array<{ slug: string; name: string }>) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const exactCategory = categories.find((category) => category.name.toLowerCase() === trimmed || category.slug.toLowerCase() === trimmed);
  if (exactCategory) return exactCategory.slug;

  const numericIndex = Number(trimmed);
  if (!Number.isNaN(numericIndex) && numericIndex > 0) {
    return categories[numericIndex - 1]?.slug ?? null;
  }

  return null;
}

export function buildInfobipReply(raw: string, categories: Array<{ slug: string; name: string }>, products: Array<{ name: string; price: string; categorySlug: string | null }>) {
  const input = (raw ?? "").trim();
  const normalized = input.toLowerCase();

  const buyMatch = normalized.match(/^buy\s+(.+)$/);
  if (buyMatch) {
    const productQuery = buyMatch[1].trim();
    const matches = products.filter((product) => product.name.toLowerCase().includes(productQuery));
    if (matches.length > 0) {
      const topMatch = matches[0];
      return [
        `${topMatch.name}`,
        `Price: K${Number(topMatch.price).toLocaleString()}`,
        "To order, reply with: BUY " + topMatch.name,
        "Cash on delivery is available in local areas.",
      ].join("\n");
    }
  }

  if (!input || SHOP_TRIGGER_WORDS.some((word) => normalized === word || normalized.startsWith(`${word} `))) {
    const list = categories.length
      ? categories.map((category, index) => `${index + 1}. ${category.name}`).join("\n")
      : "No categories available yet.";

    return [
      "PEZA Store",
      "Reply with a category number to browse products.",
      list,
      "Example: 1",
      "Or send a product name like: rice",
    ].join("\n");
  }

  const selectedCategorySlug = parseCategorySelection(input, categories);
  if (selectedCategorySlug) {
    const categoryProducts = products.filter((product) => (product.categorySlug ?? "") === selectedCategorySlug);
    if (categoryProducts.length === 0) {
      return `No products are available in this category yet. Reply with another category number or send a product name like rice.`;
    }

    return [
      `Products in ${categories.find((c) => c.slug === selectedCategorySlug)?.name ?? selectedCategorySlug}:`,
      ...categoryProducts.slice(0, 5).map((product) => `${product.name} - K${Number(product.price).toLocaleString()}`),
      "Reply with the exact product name to buy it, or send MENU to see categories again.",
    ].join("\n");
  }

  const matches = products.filter((product) => product.name.toLowerCase().includes(normalized));
  if (matches.length > 0) {
    const topMatch = matches[0];
    return [
      `${topMatch.name}`,
      `Price: K${Number(topMatch.price).toLocaleString()}`,
      "To order, reply with: BUY " + topMatch.name,
      "Cash on delivery is available in local areas.",
    ].join("\n");
  }

  return "I did not recognize that request. Reply MENU to see the store categories or send a product name like rice.";
}

async function processInfobipInboundMessage(body: any) {
  const text = String(body?.text ?? body?.message?.text ?? "").trim();
  const sender = String(body?.from ?? body?.sender ?? body?.msisdn ?? "");
  const channel = String(body?.channel ?? body?.message?.type ?? "sms").toLowerCase();
  const payload = body ?? {};

  if (!text) {
    return { ok: false, error: "Missing text body" };
  }

  const categories = await db.select().from(schema.categories).orderBy(schema.categories.name);

  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      price: schema.products.price,
      categorySlug: schema.products.categorySlug,
    })
    .from(schema.products)
    .where(or(like(schema.products.name, `%${text}%`), like(schema.products.description, `%${text}%`)))
    .limit(20);

  const fallbackProducts = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      price: schema.products.price,
      categorySlug: schema.products.categorySlug,
    })
    .from(schema.products)
    .limit(25);

  const replyText = buildInfobipReply(text, categories, products.length > 0 ? products : fallbackProducts);

  await db.insert(schema.infobipMessages).values({
    provider: "infobip",
    channel,
    direction: "inbound",
    sender: sender || null,
    recipient: "storefront",
    body: text,
    status: "received",
    payload,
  });

  return { ok: true, replyText, channel, sender };
}

paymentWebhookRoutes.post("/mobile-money", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.provider || !body?.reference || !body?.status || !body?.externalId) {
    return c.json({ error: "Malformed payload — expected provider, reference, status, externalId" }, 400);
  }

  const secretEnvKey = PROVIDER_SECRET_ENV[body.provider];
  const configuredSecret = secretEnvKey ? process.env[secretEnvKey] : undefined;
  if (!configuredSecret) {
    return c.json({ error: `${body.provider} webhook is not configured yet` }, 501);
  }

  const providedSecret = c.req.header("x-webhook-secret");
  if (providedSecret !== configuredSecret) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const txId = Number(body.externalId);
  const [existing] = await db
    .select()
    .from(schema.walletTransactions)
    .where(and(eq(schema.walletTransactions.id, txId), eq(schema.walletTransactions.status, "pending")))
    .limit(1);
  if (!existing) {
    return c.json({ error: "No matching pending transaction" }, 404);
  }

  await db
    .update(schema.walletTransactions)
    .set({ status: body.status === "SUCCESS" ? "completed" : "failed", providerReference: body.reference })
    .where(eq(schema.walletTransactions.id, txId));

  return c.json({ ok: true });
});

paymentWebhookRoutes.post("/infobip/sms", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "No payload provided" }, 400);
  }

  const secret = process.env.INFOBIP_WEBHOOK_SECRET;
  const providedSecret = c.req.header("x-webhook-secret") || c.req.header("x-infobip-signature");
  if (secret && providedSecret !== secret) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const result = await processInfobipInboundMessage({ ...body, channel: "sms" });
  return c.json({ ok: result.ok, replyText: result.replyText, channel: result.channel, sender: result.sender });
});

paymentWebhookRoutes.post("/infobip/whatsapp", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "No payload provided" }, 400);
  }

  const secret = process.env.INFOBIP_WEBHOOK_SECRET;
  const providedSecret = c.req.header("x-webhook-secret") || c.req.header("x-infobip-signature");
  if (secret && providedSecret !== secret) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const result = await processInfobipInboundMessage({ ...body, channel: "whatsapp" });
  return c.json({ ok: result.ok, replyText: result.replyText, channel: result.channel, sender: result.sender });
});

paymentWebhookRoutes.get("/infobip/test", async (c) => {
  const categories = await db.select().from(schema.categories).orderBy(schema.categories.name);
  const products = await db
    .select({
      name: schema.products.name,
      price: schema.products.price,
      categorySlug: schema.products.categorySlug,
    })
    .from(schema.products)
    .limit(5);

  return c.json({
    sample: buildInfobipReply("menu", categories, products),
    categoriesCount: categories.length,
    productsCount: products.length,
  });
});
