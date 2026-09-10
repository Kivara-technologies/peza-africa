import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";

const marketPriceSchema = z.object({
  category: z.string().min(1),
  item: z.string().min(1),
  price: z.union([z.string(), z.number()]),
  change: z.string().optional(),
  isUp: z.boolean().nullable().optional(),
  market: z.string().optional(),
  unit: z.string().optional(),
  source: z.string().optional(),
});

export const marketRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ ctx, input }) => ctx.db.select().from(schema.marketPrices).where(input?.category ? eq(schema.marketPrices.category, input.category) : undefined)),

  // Sync is intended for Vercel Cron or a trusted operations job. The source
  // is deliberately configurable so PEZA can connect to a verified Zambia
  // market-price API without hard-coding an unlicensed scraper.
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") return { success: false, updated: 0, message: "Admin account required" };
    const sourceUrl = process.env.PEZA_MARKET_PRICES_API_URL;
    if (!sourceUrl) return { success: false, updated: 0, message: "PEZA_MARKET_PRICES_API_URL is not configured" };

    const response = await fetch(sourceUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Market price source returned ${response.status}`);
    const payload = await response.json() as unknown;
    const rows = Array.isArray(payload) ? payload : (payload && typeof payload === "object" && "prices" in payload && Array.isArray((payload as { prices: unknown }).prices) ? (payload as { prices: unknown[] }).prices : []);
    const parsed = rows.map((row) => marketPriceSchema.parse(row));

    for (const row of parsed) {
      await ctx.db.insert(schema.marketPrices).values({
        category: row.category,
        item: row.item,
        price: String(row.price),
        change: row.change ?? "0%",
        isUp: row.isUp ?? null,
        market: row.market ?? "",
        unit: row.unit ?? "ZMW",
        source: row.source ?? sourceUrl,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: [schema.marketPrices.category, schema.marketPrices.item, schema.marketPrices.market],
        set: { price: String(row.price), change: row.change ?? "0%", isUp: row.isUp ?? null, unit: row.unit ?? "ZMW", source: row.source ?? sourceUrl, updatedAt: new Date() },
      });
    }
    return { success: true, updated: parsed.length };
  }),
});
