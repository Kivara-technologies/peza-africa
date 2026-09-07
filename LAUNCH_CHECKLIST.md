# PEZA Africa Launch Checklist

This file captures the complete work done so far and turns it into a practical step-by-step launch guide you can follow on your own.

## 1. What is already built

### Storefront and marketplace polish
- Premium hero banners have been added to the home page.
- The landing page uses a more premium, retail-style presentation inspired by major e-commerce storefronts.
- Product cards are designed for conversion and mobile-first browsing.
- Categories and filters are available for browsing products in the storefront.

Files involved:
- src/pages/Home.tsx
- src/data/premiumBanners.ts
- src/components/PremiumProductCard.tsx
- src/pages/Shop.tsx

### Cash on delivery integration
- The app now supports Cash on Delivery as a checkout option.
- Payment flows were adjusted to support COD-friendly ordering.

Files involved:
- src/pages/Cart.tsx
- server/routers/order.ts

### WhatsApp / SMS storefront webhook flow
- The app has an inbound messaging flow for product browsing and catalog prompts.
- A customer can trigger menu or product discovery interactions over WhatsApp/SMS.
- It can respond with product info and responds in a storefront style.

Files involved:
- server/routers/paymentWebhook.ts
- server/routers/paymentWebhook.test.ts

### Vendor selling flow
- The seller dashboard is set up for listing products and managing stock.
- The app supports vendor product CRUD and sales summary logic.

Files involved:
- server/routers/vendor.ts
- src/pages/Vendor.tsx

### Product catalog / market-ready seed
- A launch-ready 20-product seed catalog was created based on realistic Zambian pricing and product mix.
- The catalog includes categories across electronics, beauty, groceries, home, auto, and fashion.

Files involved:
- db/launch_20_market_cards.json
- db/launch_20_market_cards.sql

### Preview login fallback
- Because Supabase credentials are not always available in preview/dev mode, a safe demo fallback was added so the app still works without cloud credentials.
- The fallback user is configured as a vendor so the seller flow can be tested immediately.

Files involved:
- src/lib/supabaseClient.ts
- server/trpc.ts

---

## 2. Demo vendor login

Use this account to access the app in preview mode:

- Email: demo@peza.africa
- Password: demo123

This login is intended to allow you to access the seller flow without needing live Supabase credentials yet.

---

## 3. How to use the app as a seller

After logging in:

1. Open the Vendor page.
2. Click “List Product”.
3. Add the product details:
   - name
   - description
   - price
   - compare price (optional)
   - image URL
   - category
   - WhatsApp number
   - layby months (optional)
   - stock
4. Save the product.
5. Repeat for additional products.

This lets you act as the vendor and manage your storefront as if you are the seller responding to buyers.

---

## 4. Product catalog to use for launch

The 20 product starter set is in:
- db/launch_20_market_cards.json
- db/launch_20_market_cards.sql

It was built to be realistic for Zambia and includes:
- Electronics: smartphones, earbuds, power banks, TV
- Fashion: shirts, handbags, sandals, chitenge
- Home: cookware, lights, solar kits, sofa set
- Auto: seat covers, lights, battery
- Beauty: skincare kit, body cream
- Groceries: mealie meal, cooking oil

This gives you a launch-ready catalog that looks credible and matches the local market better than random generic items.

---

## 5. Environment variables to add in Vercel

When you are ready to launch properly, add the following environment variables in your Vercel project settings:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- DATABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- INFOBIP_WEBHOOK_SECRET
- AIRTEL_WEBHOOK_SECRET
- MTN_WEBHOOK_SECRET
- ZAMTEL_WEBHOOK_SECRET

After adding them:
1. go to Vercel project
2. open Settings > Environment Variables
3. add each value
4. redeploy

---

## 6. How to deploy yourself

Run these commands in the terminal:

```bash
cd /workspaces/peza-africa
npx vercel login
npx vercel --prod
```

Then:
1. choose the project
2. select the linked project
3. answer no to pulling env variables into .env.local
4. wait for deployment to finish

The project is already linked to the Vercel project and the production deployment path is set up.

---

## 7. Vercel production link

The live production deployment was already created successfully with the linked project:

- https://peza-africa-bnnffwhke-vonse.vercel.app
- https://shop.peza.africa

---

## 8. Why the login was failing before

The issue was not really the app itself. It was the missing Supabase configuration in preview/deployment environments. When the required Supabase env vars are absent, the app cannot create a real auth session.

That is why the preview fallback was added, so the app can still be used in a controlled preview state.

---

## 9. What to do now, in the fastest order

If you want to move fast, do this in order:

1. Sign in using demo@peza.africa / demo123
2. Go to the Vendor page
3. Add 10-20 products from the seed list
4. Set your WhatsApp contact number
5. Deploy to Vercel if not already deployed
6. Add real env vars in Vercel when ready
7. Reconnect Supabase for real auth and live seller accounts

---

## 10. Best next move for your launch

Your best two-day launch path is:

- Use the preview vendor account for early testing
- Add your first batch of product cards
- Set the home banners and categories
- Publish the site on Vercel
- Then connect Supabase and real production auth once the launch date is near

This keeps the storefront looking polished while you still have the ability to manage it without the full cloud auth complexity.

---

## 11. Summary

The app is already in a strong state for a launch-ready storefront with:
- premium banners
- vendor dashboard
- product catalog setup
- COD support
- WhatsApp/SMS storefront trigger logic
- a working preview log-in path for early use

You can proceed without waiting for perfect production Supabase credentials, then upgrade to full production auth and provider secrets later.
