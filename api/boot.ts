// Local dev entry point, used by @hono/vite-dev-server (see vite.config.ts).
// Vercel does NOT use this file - it uses api/[...path].ts instead.
import { app } from "../server/app.js";

export default app;
