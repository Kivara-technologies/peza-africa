import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { schema } from "../../db";
import { eq, desc } from "drizzle-orm";

const orderItemInput = z.object({
  productId: z.number(),
  productName: z.string(),
  productImage: z.string().optional().nullable(),
  price: z.string(),
  quantity: z.number(),
  total: z.string(),
});

export const orderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, ctx.user.id))
      .orderBy(desc(schema.orders.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        orderNumber: z.string(),
        subtotal: z.string(),
        shipping: z.string(),
        discount: z.string().default("0"),
        total: z.string(),
        paymentMethod: z.string(),
        items: z.array(orderItemInput).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .insert(schema.orders)
        .values({
          userId: ctx.user.id,
          orderNumber: input.orderNumber,
          subtotal: input.subtotal,
          shipping: input.shipping,
          discount: input.discount,
          total: input.total,
          paymentMethod: input.paymentMethod,
          status: "pending",
        })
        .returning();

      await ctx.db.insert(schema.orderItems).values(
        input.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage ?? null,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
      );

      // If paying from wallet, debit the balance immediately.
      if (input.paymentMethod.toUpperCase() === "WALLET") {
        await ctx.db.insert(schema.walletTransactions).values({
          userId: ctx.user.id,
          amount: `-${input.total}`,
          type: "payment",
          description: `Order ${input.orderNumber}`,
        });
      }

      await ctx.db.insert(schema.notifications).values({
        userId: ctx.user.id,
        type: "order",
        title: "Order placed",
        message: `Your order ${input.orderNumber} has been received.`,
      });

      return order;
    }),
});
