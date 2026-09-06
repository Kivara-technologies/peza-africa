import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

const orderItemInput = z.object({
  productId: z.number(),
  quantity: z.number().int().positive(),
});

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

  create: protectedProcedure
    .input(
      z.object({
        paymentMethod: z.enum(["AIRTEL", "MTN", "ZAMTEL", "WALLET"]),
        deliveryAddress: z.string().min(5, "Enter a delivery address"),
        deliveryPhone: z.string().min(6, "Enter a contact phone number"),
        deliveryLat: z.number().optional(),
        deliveryLng: z.number().optional(),
        items: z.array(orderItemInput).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Everything below runs in one transaction: if anything fails partway
      // (bad stock, insufficient wallet balance, a crash), nothing commits —
      // no order-with-no-items, no debited-wallet-with-no-order.
      return ctx.db.transaction(async (tx) => {
        const productIds = input.items.map((i) => i.productId);

        // Lock the rows we're about to sell against concurrent checkouts on
        // the same stock.
        const products = await tx
          .select()
          .from(schema.products)
          .where(inArray(schema.products.id, productIds))
          .for("update");

        const productById = new Map(products.map((p) => [p.id, p]));

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

        // Prices come from the DB, never from the client.
        const lineItems = input.items.map((item) => {
          const product = productById.get(item.productId)!;
          const price = Number(product.price);
          return {
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            price: product.price,
            quantity: item.quantity,
            total: (price * item.quantity).toFixed(2),
          };
        });

        const subtotal = lineItems.reduce((sum, li) => sum + Number(li.total), 0);
        const shipping = subtotal > 0 ? 150 : 0;
        const total = subtotal + shipping;

        // Wallet payments must be covered by an actual completed balance —
        // no floor-less negative balances.
        if (input.paymentMethod === "WALLET") {
          const [balanceRow] = await tx
            .select({ balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)` })
            .from(schema.walletTransactions)
            .where(
              and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")),
            );
          const balance = Number(balanceRow?.balance ?? 0);
          if (balance < total) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient wallet balance (K${balance.toLocaleString()} available, K${total.toLocaleString()} required)`,
            });
          }
        }

        const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
        const [order] = await tx
          .insert(schema.orders)
          .values({
            userId: ctx.user.id,
            orderNumber,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            discount: "0",
            total: total.toFixed(2),
            paymentMethod: input.paymentMethod,
            deliveryAddress: input.deliveryAddress,
            deliveryPhone: input.deliveryPhone,
            deliveryLat: input.deliveryLat?.toString(),
            deliveryLng: input.deliveryLng?.toString(),
            // Wallet debits happen immediately below, so that order is paid
            // right away. Mobile money orders stay "pending" until a
            // provider webhook confirms the charge (not yet wired to a live
            // provider — see server/routers/paymentWebhook.ts).
            status: input.paymentMethod === "WALLET" ? "paid" : "pending",
          })
          .returning();

        await tx.insert(schema.orderItems).values(lineItems.map((li) => ({ orderId: order.id, ...li })));

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
            amount: `-${total.toFixed(2)}`,
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
              : `Your order ${orderNumber} is pending ${input.paymentMethod} payment confirmation.`,
        });

        return order;
      });
    }),
});
