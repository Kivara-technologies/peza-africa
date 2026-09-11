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
import { vendorRouter } from "./routers/vendor.js";
import { chilimbaRouter } from "./routers/chilimba.js";
import { riderRouter } from "./routers/rider.js";
import { importerRouter } from "./routers/importer.js";

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
  vendor: vendorRouter,
  chilimba: chilimbaRouter,
  rider: riderRouter,
  importer: importerRouter,
});

export type AppRouter = typeof appRouter;
