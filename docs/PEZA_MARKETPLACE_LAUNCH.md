# PEZA Africa Marketplace — Launch Runbook

## 1. Architecture

- `www.peza.africa` — public brand, acquisition and investor site.
- `shop.peza.africa` — transactional marketplace.
- Vercel — web/API hosting.
- Supabase — Auth + PostgreSQL.
- Resend — production auth email delivery through `auth.peza.africa`.
- Infobip — SMS/WhatsApp integrations already present in the platform.

## 2. Profile management

`profiles` now supports name, phone, avatar URL, address, city, country, business name/type/description and website. `auth.updateProfile` validates and writes only the signed-in user's own row. Logout remains Supabase-session based: the UI calls the protected logout mutation and then `supabase.auth.signOut()` so the browser session is actually cleared.

For production photo uploads, point `avatarUrl` at a Supabase Storage object. Do not place a service-role key in the browser.

## 3. Dynamic categories

Categories are database-driven. The API returns only active categories and orders them by `sort_order`, so adding a category does not require a frontend release.

Launch taxonomy includes:

- Cars → Used Cars
- Bikes → Motorcycles
- Agriculture → Farm Inputs
- Electronics
- Fashion
- Services

To add a category, insert a row into `categories` with `name`, `slug`, `sort_order`, optional `parent_id`, and `is_active=true`.

## 4. Rider UX flow

```text
Sign in
  ↓
Rider Dashboard
  ├─ GO ONLINE → browser GPS → rider_locations
  ├─ Nearby opportunities → Claim
  │      ↓
  │   Active trip → Navigate → Deliver
  │      ↓
  │   rider_earning recorded → Trip history / Earnings
  └─ History → completed trips
```

The dashboard refreshes live orders every 8 seconds and earnings every 15 seconds. Location sharing stops when the rider goes offline or leaves the page.

Rider earnings use configurable PEZA defaults of K6.70 base + K1.10/km when a delivery coordinate and rider location are available; the stored earning never falls below the order's shipping charge. These values are implementation defaults, not a promise that PEZA's commercial rider contract matches Yango's published rates.

## 5. Vendor UX

The vendor portal is category-driven and already provides product CRUD, stock, sales summary and listing management. Product creation uses the live category table, so Cars/Bikes and future categories automatically appear in the seller form.

Recommended next vendor upgrades:

- sales chart by day/week/month
- low-stock alerts
- top products
- returns/cancellations
- profit after PEZA fees
- CSV export

## 6. Shipping calculator

All customer-facing estimates are ZMW.

### Local / intra-city

Planning formula:

`base K25 + K4.50 × distance_km + K10 × kg_over_5`

This is an estimate inspired by app-based courier UX: show the price upfront, keep it short-distance focused, and make the estimate explicit before booking.

### Zambia-wide

The calculator contains route estimates for major Lusaka routes and standard/overnight options. Rates are planning estimates informed by published Zambian courier/bus market prices and must be confirmed at booking. The source/rate table is intentionally separated from checkout so commercial rates can be changed without rewriting the order system.

## 7. Market prices

The application now supports a daily JSON market-price feed. Configure:

- `PEZA_MARKET_PRICES_API_URL`
- `PEZA_MARKET_CRON_SECRET`

The endpoint is:

`GET /api/market-prices/sync`

with header:

`x-peza-cron-secret: <secret>`

Accepted payload:

```json
{
  "prices": [
    {
      "category": "commodities",
      "item": "Maize (50kg)",
      "price": 340,
      "change": "+2.4%",
      "isUp": true,
      "market": "Soweto, Lusaka",
      "unit": "ZMW",
      "source": "verified-provider"
    }
  ]
}
```

The GitHub Actions workflow runs daily at 05:00 UTC and can also be triggered manually. Add `PEZA_MARKET_CRON_SECRET` to GitHub repository Actions secrets and the same value to Vercel environment variables.

**Important:** PEZA should connect this feed to a verified licensed/contracted Zambia price provider. Do not silently scrape an illustrative website and label it as official live data.

## 8. Visual assets

Category artwork is stored under `public/assets/categories/` and is local, responsive SVG artwork. Product cards remain data-driven through the product image field. Brand logos should only be added from approved/licensed sources; do not copy third-party logos into the repository without permission.

## 9. Supabase migrations

The latest marketplace migrations add:

- profile customization fields
- hierarchical/dynamic category metadata
- Cars, Bikes, Agriculture, Electronics, Fashion and Services launch categories
- rider earnings
- market price source/market/unit metadata
- market-price upsert key

Apply migrations in order using the Supabase migration workflow.

## 10. Production environment

Required production secrets include the existing Supabase/database variables plus:

```text
PEZA_MARKET_PRICES_API_URL=https://<verified-price-provider>/prices
PEZA_MARKET_CRON_SECRET=<long-random-secret>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, database credentials, payment secrets, Resend API keys, or the cron secret to browser code.

## 11. Launch acceptance tests

### Customer
- signup email arrives
- confirmation link returns to `shop.peza.africa/login`
- login survives refresh
- profile updates persist
- logout clears session
- category navigation shows Cars/Bikes/etc.
- product → cart → checkout → order
- order status and tracking update

### Vendor
- seller sees only own products/orders
- create/edit/delete product
- category list is dynamic
- stock changes persist
- sales analytics match order data

### Rider
- become rider
- dashboard exits loading state
- go online/offline
- location updates
- claim race protection
- active trip navigation
- mark delivered
- earnings and history update

### Operations
- duplicate payment webhook is idempotent
- RLS prevents cross-user access
- `rls_auto_enable()` is not publicly executable
- leaked-password protection enabled
- Resend DNS is verified
- daily market feed succeeds
