import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { categoryRouter } from "./routers/category";
import { productRouter } from "./routers/product";
import { orderRouter } from "./routers/order";
import { walletRouter } from "./routers/wallet";
import { supplierRouter } from "./routers/supplier";
import { marketRouter } from "./routers/market";
import { jobRouter } from "./routers/job";
import { chatRouter } from "./routers/chat";
import { notificationRouter } from "./routers/notification";

export const appRouter = router({
  auth: authRouter,
  category: categoryRouter,
  product: productRouter,
  order: orderRouter,
  wallet: walletRouter,
  supplier: supplierRouter,
  market: marketRouter,
  job: jobRouter,
  chat: chatRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
