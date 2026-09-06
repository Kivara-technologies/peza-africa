import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { categoryRouter } from "./routers/category.js";
import { productRouter } from "./routers/product.js";
import { orderRouter } from "./routers/order.js";
import { walletRouter } from "./routers/wallet.js";
import { supplierRouter } from "./routers/supplier.js";
import { marketRouter } from "./routers/market.js";
import { jobRouter } from "./routers/job.js";
import { chatRouter } from "./routers/chat.js";
import { notificationRouter } from "./routers/notification.js";
import { chilimbaRouter } from "./routers/chilimba.js";
import { airtimeRouter } from "./routers/airtime.js";
import { vendorRouter } from "./routers/vendor.js";

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
<<<<<<< HEAD
  chilimba: chilimbaRouter,
  airtime: airtimeRouter,
=======
>>>>>>> 6898e4101e734d9bf1c2e27b8bd8aaefa73c4e5c
  vendor: vendorRouter,
});

export type AppRouter = typeof appRouter;
