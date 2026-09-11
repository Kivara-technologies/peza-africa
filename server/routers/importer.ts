import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";

const importRow = z.object({
  name: z.string().min(1), price: z.number().positive(), comparePrice: z.number().positive().optional(),
  image: z.string().url(), description: z.string().optional(), categorySlug: z.string().optional(), category: z.string().optional(),
  brand: z.string().optional(), vendor: z.string().optional(), stock: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(), reviewCount: z.number().int().min(0).optional(),
  whatsappNumber: z.string().optional(), source: z.string().optional(), sourceUrl: z.string().url().optional(),
});

function requireAdmin(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin account required" }); }
function normalize(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export const importerRouter = router({
  importProducts: protectedProcedure
    .input(z.object({ source: z.string().min(1).max(80), fileName: z.string().max(255).optional(), rows: z.array(importRow).min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const categories = await ctx.db.select().from(schema.categories);
      const categoryBySlug = new Map(categories.map((c) => [normalize(c.slug), c]));
      const categoryByName = new Map(categories.map((c) => [normalize(c.name), c]));
      const existing = await ctx.db.select({ name: schema.products.name, image: schema.products.image }).from(schema.products);
      const existingKeys = new Set(existing.map((p) => `${normalize(p.name)}|${p.image}`));
      let imported = 0; let skipped = 0;
      const errors: Array<{ row: number; message: string }> = [];
      const toInsert: Array<typeof schema.products.$inferInsert> = [];

      for (let i = 0; i < input.rows.length; i += 1) {
        const row = input.rows[i];
        try {
          const category = row.categorySlug ? categoryBySlug.get(normalize(row.categorySlug)) : row.category ? categoryByName.get(normalize(row.category)) : undefined;
          if (!category) throw new Error(`Unknown category: ${row.categorySlug || row.category || "missing"}`);
          const key = `${normalize(row.name)}|${row.image}`;
          if (existingKeys.has(key)) { skipped += 1; continue; }
          existingKeys.add(key);
          toInsert.push({
            name: row.name.trim(), description: row.description?.trim() || null, price: row.price.toString(), comparePrice: row.comparePrice?.toString() ?? null,
            image: row.image, categoryId: category.id, categorySlug: category.slug, vendorId: null, vendor: row.vendor?.trim() || row.source || "PEZA Marketplace",
            rating: (row.rating ?? 4.5).toString(), reviewCount: row.reviewCount ?? 0, whatsappNumber: row.whatsappNumber || null, stock: row.stock ?? 100,
            slug: `${normalize(row.name)}-${Date.now()}-${i}`,
          });
          imported += 1;
        } catch (error) { errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Invalid row" }); }
      }

      for (let offset = 0; offset < toInsert.length; offset += 250) await ctx.db.insert(schema.products).values(toInsert.slice(offset, offset + 250));
      await ctx.db.insert(schema.adminAuditLog).values({ actorId: ctx.user.id, action: "admin.bulkProductImport", targetType: "product_import", targetId: input.source, detail: { fileName: input.fileName ?? null, totalRows: input.rows.length, imported, skipped, failed: errors.length, errors: errors.slice(0, 100) } });
      return { total: input.rows.length, imported, skipped, failed: errors.length, errors: errors.slice(0, 100) };
    }),
});
