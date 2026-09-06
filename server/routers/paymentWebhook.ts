import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";

// Receives payment confirmations from Airtel Money / MTN MoMo / Zamtel
// Kwacha and is the ONLY code path allowed to move a wallet top-up from
// "pending" to "completed". `wallet.topUp` (server/routers/wallet.ts)
// deliberately never does this itself.
//
// NOT YET LIVE: each provider has its own signature scheme, payload shape,
// and sandbox/production URLs, none of which are wired up here because
// that requires real merchant credentials from Airtel/MTN/Zamtel. What's
// here is the safe skeleton: it verifies a shared secret before trusting
// anything, and refuses every request if that secret isn't configured, so
// this endpoint can't become a second free-money hole while it's unfinished.
//
// To go live for a given provider:
//   1. Get merchant/API credentials + webhook signing secret from them.
//   2. Set e.g. AIRTEL_WEBHOOK_SECRET in the environment.
//   3. Replace the placeholder signature check below with that provider's
//      actual verification (HMAC, JWT, or whatever they specify).
//   4. Point the provider's webhook URL at /api/webhooks/mobile-money.

export const paymentWebhookRoutes = new Hono();

const PROVIDER_SECRET_ENV: Record<string, string> = {
  "Airtel Money": "AIRTEL_WEBHOOK_SECRET",
  "MTN MoMo": "MTN_WEBHOOK_SECRET",
  "Zamtel Kwacha": "ZAMTEL_WEBHOOK_SECRET",
};

paymentWebhookRoutes.post("/mobile-money", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.provider || !body?.reference || !body?.status || !body?.externalId) {
    return c.json({ error: "Malformed payload — expected provider, reference, status, externalId" }, 400);
  }

  const secretEnvKey = PROVIDER_SECRET_ENV[body.provider];
  const configuredSecret = secretEnvKey ? process.env[secretEnvKey] : undefined;
  if (!configuredSecret) {
    // Refuse rather than silently accept — an unconfigured provider must
    // never be able to complete a payment.
    return c.json({ error: `${body.provider} webhook is not configured yet` }, 501);
  }

  const providedSecret = c.req.header("x-webhook-secret");
  if (providedSecret !== configuredSecret) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // externalId is OUR wallet_transactions.id, generated when the pending
  // top-up was created — this is what ties the provider's callback back to
  // a specific request instead of just "any pending row from this provider."
  const txId = Number(body.externalId);
  const [existing] = await db
    .select()
    .from(schema.walletTransactions)
    .where(and(eq(schema.walletTransactions.id, txId), eq(schema.walletTransactions.status, "pending")))
    .limit(1);
  if (!existing) {
    return c.json({ error: "No matching pending transaction" }, 404);
  }

  await db
    .update(schema.walletTransactions)
    .set({ status: body.status === "SUCCESS" ? "completed" : "failed", providerReference: body.reference })
    .where(eq(schema.walletTransactions.id, txId));

  return c.json({ ok: true });
});
