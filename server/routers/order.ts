import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { toCents, mulCents, sumCents, fromCents } from "../lib/money.js";

const orderItemInput = z.object({ productId: z.number(), quantity: z.number().int().positive() });
const createOrderInput = z.object({
  paymentMethod: z.enum(["AIRTEL", "MTN", "ZAMTEL", "WALLET", "CASH_ON_DELIVERY"]),
  deliveryAddress: z.string().min(5, "Enter a delivery address"),
  deliveryPhone: z.string().min(6, "Enter a contact phone number"),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  items: z.array(orderItemInput).min(1),
});
type CreateOrderInput = z.infer<typeof createOrderInput>;
const SHIPPING_FEE_CENTS = 150 * 100;

function requireAdmin(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin account required" }); }
function generateOrderNumber(): string { const rand = Math.random().toString(36).slice(2, 8).toUpperCase(); return `ORD-${Date.now().toString(36).toUpperCase()}${rand}`; }

async function placeOrder(ctx: { db: any; user: { id: string; role: string } }, input: CreateOrderInput) {
  return ctx.db.transaction(async (tx: any) => {
    // Aggregate duplicate cart lines before validating/decrementing stock.
    const quantities = new Map<number, number>();
    for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    const productIds = [...quantities.keys()];

    const products = await tx.select().from(schema.products).where(inArray(schema.products.id, productIds)).for("update");
    const productById = new Map<number, (typeof products)[number]>(products.map((p: (typeof products)[number]) => [p.id, p]));

    for (const [productId, quantity] of quantities) {
      const product = productById.get(productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${productId} not found` });
      if (product.stock < quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${product.stock} left of "${product.name}" — reduce the quantity` });
    }

    const lineItems = [...quantities].map(([productId, quantity]) => {
      const product = productById.get(productId)!;
      const totalCentsForLine = mulCents(product.price, quantity);
      return { productId: product.id, productName: product.name, productImage: product.image, price: product.price, quantity, totalCents: totalCentsForLine, total: fromCents(totalCentsForLine) };
    });
    const subtotalCents = sumCents(lineItems.map((li) => li.totalCents));
    const shippingCents = subtotalCents > 0 ? SHIPPING_FEE_CENTS : 0;
    const totalCents = subtotalCents + shippingCents;

    if (input.paymentMethod === "WALLET") {
      const [balanceRow] = await tx.select({ balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)` }).from(schema.walletTransactions).where(and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")));
      const balanceCents = toCents(balanceRow?.balance ?? "0");
      if (balanceCents < totalCents) throw new TRPCError({ code: "BAD_REQUEST", message: `Insufficient wallet balance (K${fromCents(balanceCents)} available, K${fromCents(totalCents)} required)` });
    }

    const orderNumber = generateOrderNumber();
    const isMobileMoney = ["AIRTEL", "MTN", "ZAMTEL"].includes(input.paymentMethod);
    const [order] = await tx.insert(schema.orders).values({
      userId: ctx.user.id, orderNumber, subtotal: fromCents(subtotalCents), shipping: fromCents(shippingCents), discount: "0", total: fromCents(totalCents),
      paymentMethod: input.paymentMethod, paymentReference: isMobileMoney ? orderNumber : null,
      deliveryAddress: input.deliveryAddress, deliveryPhone: input.deliveryPhone, deliveryLat: input.deliveryLat?.toString(), deliveryLng: input.deliveryLng?.toString(),
      status: input.paymentMethod === "WALLET" ? "paid" : input.paymentMethod === "CASH_ON_DELIVERY" ? "processing" : "pending",
    }).returning();

    await tx.insert(schema.orderItems).values(lineItems.map(({ totalCents: _totalCents, ...li }) => ({ orderId: order.id, ...li })));
    for (const [productId, quantity] of quantities) await tx.update(schema.products).set({ stock: sql`${schema.products.stock} - ${quantity}` }).where(eq(schema.products.id, productId));

    if (input.paymentMethod === "WALLET") await tx.insert(schema.walletTransactions).values({ userId: ctx.user.id, amount: `-${fromCents(totalCents)}`, type: "payment", status: "completed", description: `Order ${orderNumber}` });

    await tx.insert(schema.notifications).values({ userId: ctx.user.id, type: "order", title: "Order placed", message: input.paymentMethod === "WALLET" ? `Your order ${orderNumber} has been paid from your wallet.` : input.paymentMethod === "CASH_ON_DELIVERY" ? `Your order ${orderNumber} is confirmed — pay cash when it arrives.` : `Your order ${orderNumber} is pending ${input.paymentMethod} payment confirmation.` });
    return order;
  });
}

export const orderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const myOrders = await ctx.db.select().from(schema.orders).where(eq(schema.orders.userId, ctx.user.id)).orderBy(desc(schema.orders.createdAt));
    if (myOrders.length === 0) return [];
    const items = await ctx.db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, myOrders.map((o) => o.id)));
    const itemsByOrder = new Map<number, typeof items>();
    for (const item of items) { const list = itemsByOrder.get(item.orderId) ?? []; list.push(item); itemsByOrder.set(item.orderId, list); }
    return myOrders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));
  }),

  create: protectedProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
    const MAX_ATTEMPTS = 3; let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try { return await placeOrder(ctx, input); }
      catch (err: any) { const isUniqueViolation = err?.code === "23505" || /order_number/i.test(String(err?.message ?? "")); if (!isUniqueViolation) throw err; lastError = err; }
    }
    throw lastError instanceof Error ? lastError : new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not place order" });
  }),

  confirmOrder: protectedProcedure.input(z.object({ orderId: z.number(), note: z.string().optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role);
    const [order] = await ctx.db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId));
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    if (order.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: `Order is already "${order.status}", not pending` });
    const [updated] = await ctx.db.update(schema.orders).set({ status: "processing" }).where(eq(schema.orders.id, input.orderId)).returning();
    await ctx.db.insert(schema.adminAuditLog).values({ actorId: ctx.user.id, action: "order.confirmOrder", targetType: "order", targetId: String(order.id), detail: { orderNumber: order.orderNumber, note: input.note ?? null } });
    await ctx.db.insert(schema.notifications).values({ userId: order.userId, type: "order", title: "Payment confirmed", message: `Payment for order ${order.orderNumber} has been confirmed. It's ready for delivery.` });
    return updated;
  }),

  track: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => {
    const [order] = await ctx.db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId));
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    const isOwner = order.userId === ctx.user.id; const isAssignedRider = order.riderId === ctx.user.id;
    if (!isOwner && !isAssignedRider && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this order" });
    let rider: { name: string | null; phone: string | null } | null = null;
    let location: { lat: string; lng: string; updatedAt: Date; isOnline: boolean } | null = null;
    if (order.riderId) {
      const [riderProfile] = await ctx.db.select({ name: schema.profiles.name, phone: schema.profiles.phone }).from(schema.profiles).where(eq(schema.profiles.id, order.riderId));
      rider = riderProfile ?? null;
      const [loc] = await ctx.db.select().from(schema.riderLocations).where(eq(schema.riderLocations.riderId, order.riderId));
      location = loc ?? null;
    }
    return { id: order.id, orderNumber: order.orderNumber, status: order.status, deliveryAddress: order.deliveryAddress, deliveryLat: order.deliveryLat, deliveryLng: order.deliveryLng, rider, location };
  }),
});