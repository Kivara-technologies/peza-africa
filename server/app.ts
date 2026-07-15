import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";

export const app = new Hono().basePath("/api");

app.use("/*", cors());

app.all("/trpc/*", (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(c.req.raw),
  });
});

app.get("/health", (c) => c.json({ ok: true }));
