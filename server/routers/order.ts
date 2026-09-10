import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { toCents, mulCents, sumCents, fromCents } from "../lib/money.js";

const orderItemInput = z.object({
  productId: z.number(),
  quantity: z.number().int().positive(),
});

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

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin account required" });
  }
}

// Generates a short, effectively-unique order number. Not a DB sequence
// (would need a dedicated sequence object), but random enough that a
// collision is vanishingly unlikely — and the DB's unique constraint on
// order_number is the real backstop either way (see the retry loop below).
function generateOrderNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${Date.now().toString(36).toUpperCase()}${rand}`;
}

// Everything here runs in one transaction: if anything fails partway (bad
// stock, insufficient wallet balance, an order_number collision, a crash),
// nothing commits — no order-with-no-items, no debited-wallet-with-no-order.
//
// All money math is done in integer cents (see server/lib/money.ts) rather
// than `Number(numericString) * qty`, which reintroduces floating-point
// error on values that the database itself stores exactly.
async function placeOrder(ctx: { db: any; user: { id: string; role: string } }, input: CreateOrderInput) {
  return ctx.db.transaction(async (tx: any) => {
    const productIds = input.items.map((i) => i.productId);

    // Lock the rows we're about to sell against concurrent checkouts on
    // the same stock.
    const products = await tx
      .select()
      .from(schema.products)
      .where(inArray(schema.products.id, productIds))
      .for("update");

    const productById = new Map<number, (typeof products)[number]>(
      products.map((p: (typeof products)[number]) => [p.id, p]),
    );

    for (const item of input.items) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${product.stock} left of "${product.name}" — reduce the quantity`,
        });
      }
    }

    // Prices come from the DB, never from the client. All arithmetic in
    // integer cents; converted back to decimal strings only when writing.
    const lineItems = input.items.map((item) => {
      const product = productById.get(item.productId)!;
      const totalCentsForLine = mulCents(product.price, item.quantity);
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: item.quantity,
        totalCents: totalCentsForLine,
        total: fromCents(totalCentsForLine),
      };
    });

    const subtotalCents = sumCents(lineItems.map((li) => li.totalCents));
    const shippingCents = subtotalCents > 0 ? SHIPPING_FEE_CENTS : 0;
    const totalCents = subtotalCents + shippingCents;

    // Wallet payments must be covered by an actual completed balance — no
    // floor-less negative balances.
    if (input.paymentMethod === "WALLET") {
      const [balanceRow] = await tx
        .select({ balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)` })
        .from(schema.walletTransactions)
        .where(
          and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")),
        );
      const balanceCents = toCents(balanceRow?.balance ?? "0");
      if (balanceCents < totalCents) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient wallet balance (K${fromCents(balanceCents)} available, K${fromCents(totalCents)} required)`,
        });
      }
    }

    const orderNumber = generateOrderNumber();
    const [order] = await tx
      .insert(schema.orders)
      .values({
        userId: ctx.user.id,
        orderNumber,
        subtotal: fromCents(subtotalCents),
        shipping: fromCents(shippingCents),
        discount: "0",
        total: fromCents(totalCents),
        paymentMethod: input.paymentMethod,
        deliveryAddress: input.deliveryAddress,
        deliveryPhone: input.deliveryPhone,
        deliveryLat: input.deliveryLat?.toString(),
        deliveryLng: input.deliveryLng?.toString(),
        // Wallet debits happen immediately below, so that order is paid
        // right away. COD is confirmed at the point of sale (no payment
        // gateway step), so it goes straight to "processing" — the status
        // rider.ts's CLAIMABLE_STATUSES actually watches for. Mobile money
        // orders remain "pending" until a webhook (or the interim admin
        // confirmOrder mutation) confirms the charge.
        status:
          input.paymentMethod === "WALLET"
            ? "paid"
            : input.paymentMethod === "CASH_ON_DELIVERY"
              ? "processing"
              : "pending",
      })
      .returning();

    await tx.insert(schema.orderItems).values(
      lineItems.map(({ totalCents: _totalCents, ...li }) => ({ orderId: order.id, ...li })),
    );

    // Decrement stock for what was actually sold.
    for (const item of input.items) {
      await tx
        .update(schema.products)
        .set({ stock: sql`${schema.products.stock} - ${item.quantity}` })
        .where(eq(schema.products.id, item.productId));
    }

    if (input.paymentMethod === "WALLET") {
      await tx.insert(schema.walletTransactions).values({
        userId: ctx.user.id,
        amount: `-${fromCents(totalCents)}`,
        type: "payment",
        status: "completed", // debiting the platform wallet is immediate — the funds are already in it
        description: `Order ${orderNumber}`,
      });
    }

    await tx.insert(schema.notifications).values({
      userId: ctx.user.id,
      type: "order",
      title: "Order placed",
      message:
        input.paymentMethod === "WALLET"
          ? `Your order ${orderNumber} has been paid from your wallet.`
          : input.paymentMethod === "CASH_ON_DELIVERY"
            ? `Your order ${orderNumber} is confirmed — pay cash when it arrives.`
            : `Your order ${orderNumber} is pending ${input.paymentMethod} payment confirmation.`,
    });

    return order;
  });
}

export const orderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const myOrders = await ctx.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, ctx.user.id))
      .orderBy(desc(schema.orders.createdAt));

    if (myOrders.length === 0) return [];

    // One extra query for every item across all orders — not one query per
    // order — so this stays fast no matter how many orders someone has.
    const items = await ctx.db
      .select()
      .from(schema.orderItems)
      .where(
        inArray(
          schema.orderItems.orderId,
          myOrders.map((o) => o.id),
        ),
      );

    const itemsByOrder = new Map<number, typeof items>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return myOrders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));
  }),

  create: protectedProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
    // Retry on an order_number collision (unique constraint) — vanishingly
    // unlikely with generateOrderNumber(), but cheap to handle rather than
    // surface a raw 500 at checkout.
    const MAX_ATTEMPTS = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await placeOrder(ctx, input);
      } catch (err: any) {
        const isUniqueViolation = err?.code === "23505" || /order_number/i.test(String(err?.message ?? ""));
        if (!isUniqueViolation) throw err;
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not place order" });
  }),

  // Interim manual confirmation path for mobile-money orders until the real
  // provider webhook -> order mapping (Phase 2) exists. Admin-only, and
  // every use is written to admin_audit_log.
  confirmOrder: protectedProcedure
    .input(z.object({ orderId: z.number(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);

      const [order] = await ctx.db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId));
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Order is already "${order.status}", not pending` });
      }

      const [updated] = await ctx.db
        .update(schema.orders)
        .set({ status: "processing" })
        .where(eq(schema.orders.id, input.orderId))
        .returning();

      await ctx.db.insert(schema.adminAuditLog).values({
        actorId: ctx.user.id,
        action: "order.confirmOrder",
        targetType: "order",
        targetId: String(order.id),
        detail: { orderNumber: order.orderNumber, note: input.note ?? null },
      });

      await ctx.db.insert(schema.notifications).values({
        userId: order.userId,
        type: "order",
        title: "Payment confirmed",
        message: `Payment for order ${order.orderNumber} has been confirmed. It's ready for delivery.`,
      });

      return updated;
    }),

  // Polled by the customer's tracking screen every few seconds. Deliberately
  // a plain polling query rather than a client-side Supabase Realtime
  // subscription: every table in this app has RLS enabled with no policies
  // (see 0000_init.sql) and all real reads/writes go through this server
  // with the service-role key, which bypasses RLS. A few seconds of polling
  // latency is a fair trade for not opening a second, differently-secured
  // access path into the database.
  track: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId));

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const isOwner = order.userId === ctx.user.id;
      const isAssignedRider = order.riderId === ctx.user.id;
      if (!isOwner && !isAssignedRider && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this order" });
      }

      let rider: { name: string | null; phone: string | null } | null = null;
      let location: { lat: string; lng: string; updatedAt: Date; isOnline: boolean } | null = null;

      if (order.riderId) {
        const [riderProfile] = await ctx.db
          .select({ name: schema.profiles.name, phone: schema.profiles.phone })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, order.riderId));
        rider = riderProfile ?? null;

        const [loc] = await ctx.db
          .select()
          .from(schema.riderLocations)
          .where(eq(schema.riderLocations.riderId, order.riderId));
        location = loc ?? null;
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        deliveryLat: order.deliveryLat,
        deliveryLng: order.deliveryLng,
        rider,
        location,
      };
    }),
});
