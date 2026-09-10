import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { paymentWebhookRoutes } from "./routers/paymentWebhook.js";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";

export const app = new Hono().basePath("/api");
const DEFAULT_ALLOWED_ORIGINS = ["https://www.peza.africa", "https://peza.africa", "https://shop.peza.africa"];
const envOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
app.use("/*", cors({ origin: (origin) => { if (!origin) return undefined; if (allowedOrigins.has(origin) || /^https:\/\/peza-africa-.*\.vercel\.app$/.test(origin)) return origin; return undefined; } }));
app.route("/webhooks", paymentWebhookRoutes);

app.get("/market-prices/sync", async (c) => {
  const expected = process.env.PEZA_MARKET_CRON_SECRET;
  const supplied = c.req.header("x-peza-cron-secret") || c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied !== expected) return c.json({ error: "Unauthorized" }, 401);
  const sourceUrl = process.env.PEZA_MARKET_PRICES_API_URL;
  if (!sourceUrl) return c.json({ error: "PEZA_MARKET_PRICES_API_URL is not configured" }, 503);

  const response = await fetch(sourceUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) return c.json({ error: `Market source returned ${response.status}` }, 502);
  const payload = await response.json() as unknown;
  const rows = Array.isArray(payload) ? payload : (payload && typeof payload === "object" && "prices" in payload && Array.isArray((payload as { prices: unknown }).prices) ? (payload as { prices: unknown[] }).prices : []);
  let updated = 0;
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.category !== "string" || typeof row.item !== "string" || (typeof row.price !== "string" && typeof row.price !== "number")) continue;
    const market = typeof row.market === "string" ? row.market : "";
    await db.insert(schema.marketPrices).values({ category: row.category, item: row.item, price: String(row.price), change: typeof row.change === "string" ? row.change : "0%", isUp: typeof row.isUp === "boolean" ? row.isUp : null, market, unit: typeof row.unit === "string" ? row.unit : "ZMW", source: typeof row.source === "string" ? row.source : sourceUrl, updatedAt: new Date() }).onConflictDoUpdate({ target: [schema.marketPrices.category, schema.marketPrices.item, schema.marketPrices.market], set: { price: String(row.price), change: typeof row.change === "string" ? row.change : "0%", isUp: typeof row.isUp === "boolean" ? row.isUp : null, unit: typeof row.unit === "string" ? row.unit : "ZMW", source: typeof row.source === "string" ? row.source : sourceUrl, updatedAt: new Date() } });
    updated++;
  }
  return c.json({ success: true, updated, updatedAt: new Date().toISOString() });
});

app.all("/trpc/*", (c) => fetchRequestHandler({ endpoint: "/api/trpc", req: c.req.raw, router: appRouter, createContext: () => createContext(c.req.raw) }));
app.get("/health", (c) => c.json({ ok: true }));
