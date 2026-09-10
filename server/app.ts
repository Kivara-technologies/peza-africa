import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { paymentWebhookRoutes } from "./routers/paymentWebhook.js";

export const app = new Hono().basePath("/api");

// Origin allowlist rather than reflecting every request's Origin header —
// this API accepts Bearer tokens, so an open CORS policy lets any site
// make authenticated requests using a visitor's stolen/leaked token.
// ALLOWED_ORIGINS can extend this via env (comma-separated) for preview
// deployments without editing code.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.peza.africa",
  "https://peza.africa",
  "https://shop.peza.africa",
];
const envOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      // Allow Vercel preview deployments for this project (e.g.
      // peza-africa-git-*.vercel.app) in addition to the explicit list.
      if (allowedOrigins.has(origin) || /^https:\/\/peza-africa-.*\.vercel\.app$/.test(origin)) {
        return origin;
      }
      return undefined;
    },
  }),
);

app.route("/webhooks", paymentWebhookRoutes);

app.all("/trpc/*", (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(c.req.raw),
  });
});

app.get("/health", (c) => c.json({ ok: true }));
