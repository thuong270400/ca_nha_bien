# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fiship — a fresh-fish/seafood e-commerce site. Full-stack Nuxt 4: Nuxt Server API (`server/`) is the backend, no separate API service. Prisma ORM + PostgreSQL (database `e_commerce`, schema `fiship`).

## Commands

```bash
npm run dev              # dev server, http://localhost:3000
npm run build             # production build (.output/)
npm run typecheck         # nuxt typecheck (vue-tsc) — run after any change, must stay clean
node .output/server/index.mjs   # run the production build locally (needs real env vars, see below)

npm run db:migrate        # prisma migrate dev — create+apply a migration from schema.prisma changes
npm run db:deploy         # prisma migrate deploy — apply existing migrations (prod)
npm run db:seed           # prisma db seed — WIPES all data, then seeds 5 categories/25 products/1 admin/3 customers
npm run db:studio         # Prisma Studio
npm run db:reset          # drop + re-migrate the database
npm run db:generate       # regenerate Prisma Client only (postinstall already runs this)
```

There is no test suite and no linter configured in this project — don't invent `npm test`/`npm run lint` commands.

### Environment

Copy `.env.example` to `.env`. Required: `DATABASE_URL` (must include `?schema=fiship`), `DB_SCHEMA=fiship`, `NUXT_SESSION_PASSWORD` (≥32 chars). Nuxt's dev server auto-loads `.env`; the **production build does not** — export the vars into the shell (or platform env) before running `node .output/server/index.mjs`.

Seeded accounts after `npm run db:seed`: admin `admin@fiship.vn` / `Admin@123456`; customers use password `Customer@123`.

## Architecture

### Directory layout

```
app/            Nuxt 4 frontend (srcDir). components/{storefront,admin,account}/, layouts/{default,admin}.vue,
                middleware/{auth,admin}.ts, stores/cart.ts (Pinia), composables/, utils/ (auto-imported)
server/         Nitro backend — NOT under app/, sibling root dir (Nuxt convention)
  api/          REST endpoints, thin: validate input, call a service, return data
  routes/       non-/api routes, e.g. uploads/[...path].get.ts
  services/     business logic, calls Prisma directly (no repository layer — see "Deviations" below)
  utils/        prisma client singleton, error helpers, auth/cart/upload helpers, Zod schemas (server-only)
  generated/prisma/   Prisma Client output — gitignored, regenerate with `npx prisma generate`
shared/         code importable from BOTH app/ and server/ via the `#shared` alias
  schemas/      Zod schemas needed by both a frontend form and its API route (auth, address, order)
  types/        API response shapes for the frontend (catalog, cart, order, user)
prisma/         schema.prisma, migrations/, seed.ts
uploads/        runtime-written admin product images — gitignored, see "File uploads" below
```

### Server-side auto-imports

Everything exported from `server/utils/**` (Nitro convention) is globally available in every file under `server/` with no import statement: `prisma`, `Errors`, `AppError`, `defineApiHandler`, `requireAdmin`, `resolveCartId`, `getGuestOrderIds`/`addGuestOrderId`, `checkRateLimit`, `calculateShippingFee`, plus h3 (`defineEventHandler`, `createError`, `getRouterParam`, `readValidatedBody`, `getValidatedQuery`, cookies…) and nuxt-auth-utils (`setUserSession`, `requireUserSession`, `getUserSession`, `clearUserSession`).

`server/services/*.ts` files import `prisma`/`Errors` **explicitly** instead, by deliberate choice — this keeps them runnable outside Nitro (e.g. with `tsx` directly) for quick scripts/verification, unlike API route files which lean on the ambient auto-imports.

### Request handling pattern

Every `server/api/**` route is wrapped in `defineApiHandler(async (event) => {...})` (`server/utils/handler.ts`), which normalizes any thrown error — `AppError` (see `server/utils/errors.ts`, thrown via `Errors.badRequest()`/`.notFound()`/`.forbidden()`/`.conflict()`/`.tooManyRequests()`), `ZodError`, known Prisma error codes (P2002/P2025/P2003), or an existing h3 error — into one JSON shape (`{ statusCode, message, ... }`). Route handlers call `readValidatedBody(event, schema.parse)` / `getValidatedQuery(event, schema.parse)` with a Zod schema, then delegate to a service function.

Admin authorization is per-endpoint (`await requireAdmin(event)` at the top of mutating handlers), not a `/api/admin/*` route namespace — except dashboard/customers/uploads, which are admin-only by nature and do live under `/api/admin/*`.

### Zod schema split

- `shared/schemas/*.schema.ts` — used by both a Vue form (client-side validation) and its API route (server-side validation): `auth`, `address`, `order`.
- `server/utils/schemas/*.schema.ts` — server-only: `product`, `category`, `cart`, `order-query`, `common` (shared `paginationSchema`/`boolQuery`/`slugSchema` helpers).

### Catalog & pricing

`Product.price`/`compareAtPrice` are **denormalized snapshots of the default `ProductVariant`**, kept in sync by `product.service.ts` (`syncVariants`, `pickDefaultVariant`) on every create/update — this exists because Prisma can't `orderBy`/filter a to-many relation's field directly, and product listing needs to sort/filter by price. `Product.stock` is the same pattern applied to inventory: a denormalized **sum of all variants' stock**, recomputed in `createProduct`/`updateProduct` and decremented by the same amount as the variant's guarded decrement in `order.service.ts#createOrder` (same transaction, so it can't drift) — this is what lets `sort=stock_asc`/`stock_desc` (`product.schema.ts`) work without a relation-sum `orderBy`, which Prisma doesn't support. `ProductVariant.unit` is a free-form string (not an enum) so new units don't need a migration. `Product.soldCount` is incremented at order-creation time and drives the "best selling" sort/section.

`server/services/product.service.ts#resolveProductOrderBy(sort)` maps a sort string (`newest`/`oldest`/`price_asc`/`price_desc`/`name_asc`/`stock_asc`/`stock_desc`/`best_selling`) to a Prisma `orderBy` — shared by `listProducts` (the `sort` query param on `GET /api/products`) and `category.service.ts#getHomepageCategorySections`. `Category.defaultSort` (same vocabulary, minus `best_selling`) is the admin-configured default sort for a category's products, applied on the landing-page section and as the category page's initial sort before the customer picks one from the dropdown.

Orders are the only source of truth for money: `order.service.ts#createOrder` re-reads each `ProductVariant.price` from the DB inside a `$transaction`, decrements stock with a `stock: { gte: quantity }` guard on `updateMany` (atomic — throws if insufficient rather than trusting a prior read), and never accepts a client-supplied price. Product/category `DELETE` are soft deletes (`deletedAt`) since `OrderItem`/`CartItem` hold hard FKs to them.

### Cart & guest identity

`server/utils/cart-session.ts#resolveCartId(event)` is the single entry point every cart/order endpoint uses: logged-in → `Cart.userId`; anonymous → an httpOnly `guest_cart_id` cookie mapping to `Cart.sessionId`, auto-created on first use. On login, any existing guest cart's items are merged into the user's cart. Guest order lookup (`GET /api/orders/:id` with no session) is authorized via a separate httpOnly `guest_order_ids` cookie (`server/utils/guest-orders.ts`) set at order-creation time — this is what stops one guest from viewing another guest's order by guessing its id (`order.userId` is `null` for both, so identity can't be checked the normal way).

`app/stores/cart.ts` (Pinia) must call `useRequestFetch()`, not the bare global `$fetch` — plain `$fetch` does not forward the incoming request's cookies during SSR, which silently breaks first-render cart/guest-cookie state. If you add another store/composable that fetches `/api/...` during SSR outside of `useFetch` (which already handles this internally), use `useRequestFetch()` there too.

### Auth

`nuxt-auth-utils` provides the sealed httpOnly session cookie (`setUserSession`/`requireUserSession`/`getUserSession`/`clearUserSession`, `useUserSession()` on the client) — but password hashing uses `bcryptjs` directly in `auth.service.ts`, not the module's built-in scrypt `hashPassword`. Session payload shape is declared in `shared/types/auth.d.ts` (`declare module '#auth-utils'`).

### File uploads

Admin-uploaded product images are written to `uploads/products/` (repo root, **outside** `public/`) by `server/services/upload.service.ts`, and streamed back by `server/routes/uploads/[...path].get.ts`. This split is deliberate: anything under `public/` is snapshotted at `nuxt build` time, so runtime-written files there are invisible to a production build's server — `uploads/` + the streaming route work identically in dev and after a build. Seed/demo images are static SVGs under `public/images/seed/` (fine, since those exist at build time).

### Payments (VietQR bank transfer + SePay webhook)

`COD` and `BANK_TRANSFER` are the two real payment methods; `VNPAY`/`MOMO`/`ZALOPAY` remain enum-only/disabled in the checkout UI. `BANK_TRANSFER` uses VietQR's free, key-less "Quick Link" image API (`https://img.vietqr.io/image/<bankCode>-<accountNumber>-<template>.png`, built by `app/utils/vietqr.ts#buildVietQrImageUrl`) for the QR image itself — that part has no gateway/secret involved, it's a deterministic image URL computed from data already on the order. Confirmation that the money actually arrived comes from a separate SePay webhook, not from VietQR.

- **Auto-confirmation via SePay webhook**: SePay watches the configured bank account and `POST`s every matching transaction to `POST /api/webhooks/sepay` (`server/api/webhooks/sepay.post.ts`). `verifySepayWebhook` (`server/utils/sepay.ts`) rejects the request unless it's authenticated with whichever security method SePay's webhook is configured for (Company → Webhooks → Security) — HMAC-SHA256 checked first when `SEPAY_WEBHOOK_HMAC_SECRET` is set (signature = `sha256=` + hex HMAC of `` `${X-SePay-Timestamp}.${rawBody}` `` over that secret, header `X-SePay-Signature`, timestamp must be within 5 minutes to block replay — the raw request body is read directly, via h3's cached `readRawBody`, specifically so the signature is checked against the exact bytes SePay sent rather than a re-serialized `JSON.stringify`), else API Key (`Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`). Either secret is a value you generate yourself and paste into **both** `.env` and SePay's dashboard, SePay doesn't issue it. On an incoming (`transferType: 'in'`) transaction, `order.service.ts#confirmBankTransferPaymentFromSepay` finds the order via its order number (`ORD-YYYYMMDD-NNNN`, extracted with `extractOrderNumber` in `server/utils/order-number.ts` from the webhook's `code`, falling back to `content`/`description` — banks often mangle the dashes/spacing customers see in the QR's `addInfo`), then before confirming anything re-checks the receiving `accountNumber` against `Payment.bankSnapshot.bankAccountNumber` **and** `transferAmount` against `Payment.amount` — a code match alone is not trusted. `confirmBankTransferPayment` (the admin manual-confirm action) and the webhook path now share one `settlePayment` helper: the same atomic `Payment: PENDING → PAID` guarded `updateMany` (mirroring the stock-decrement guard in `createOrder`) so a double-confirm (2 admin clicks, or SePay retrying the same webhook) is a safe no-op. Any transaction the webhook can't confidently match (no order number found, account/amount mismatch) is logged and left `PENDING` — the admin manual-confirm button on `/admin/orders/:id` (`POST /api/orders/:id/confirm-payment`) is the fallback for those. The customer's order page (`app/pages/order/[id].vue`) polls every 5s while `paymentStatus === 'PENDING'` so it picks up the confirmation without a manual refresh. Setting SePay's dashboard payment-code prefix ("Công ty → Cấu hình chung → Cấu trúc mã thanh toán") to `ORD` makes matching land on the reliable `code` field every time; without it, matching still works off the raw `content`/`description` fallback, just less predictably since that depends on how the sending bank formats the transfer note.
- **Bank account = real destination**: `Setting.bankTransferEnabled`/`bankName`/`bankCode`/`bankAccountNumber`/`bankAccountName` (`/admin/settings`, "Thanh toán" section — `bankCode` populated from a dropdown backed by `GET /api/admin/settings/banks`, a thin proxy of VietQR's public `https://api.vietqr.io/v2/banks`) directly determine where the QR sends money — there is no third party overriding this. `order.service.ts#attemptCreateOrder` rejects creating a `BANK_TRANSFER` order (400) if `bankTransferEnabled` is off or the account isn't fully configured, and otherwise snapshots the current bank info onto `Payment.bankSnapshot` inside the same transaction — the QR shown to the customer (and the admin), and the account the SePay webhook cross-checks against, are always built from that snapshot, never from live `Setting`, so an admin changing banks later never rewrites where an existing order's QR points or retroactively matches its webhook.

### Prisma 7 specifics

- Generator uses the new `prisma-client` provider with `moduleFormat = "cjs"` (see `prisma/schema.prisma`). This is required, not cosmetic: without it, the generated client's `import.meta.url`-based `__dirname` shim gets mis-resolved when Nitro inlines it into the single production bundle, and `node .output/server/index.mjs` crashes on startup on Windows. Don't drop it when touching the generator block.
- No datasource `url` in `schema.prisma` — `prisma.config.ts` supplies it from `DATABASE_URL`. `server/utils/prisma.ts` builds the singleton with `new PrismaPg({ connectionString }, { schema: 'fiship' })` — note `schema` is the **second** constructor argument, not a key merged into the first (that silently no-ops and queries hit `public` instead of `fiship`).
- `prisma.config.ts` also sets `migrations.seed`, which is how `npm run db:seed` finds `prisma/seed.ts`.

### Known deviations from a "textbook" layout

- No `server/repositories/` layer — services call Prisma directly; adding a pass-through repository per model wasn't worth it at this scale.
- No multi-admin management UI yet — `/admin/customers` can lock/unlock a customer but can't promote one to `ADMIN`; that still requires a direct SQL update or editing `prisma/seed.ts`.
- `@nuxt/image` is installed but unused (plain `<img loading="lazy">` throughout) — wiring its IPX provider to both `public/images/` and the external `uploads/` dir was judged not worth the risk/time.
- `COD` and `BANK_TRANSFER` (VietQR + SePay webhook auto-confirm, manual admin confirm as fallback) have real handling; `VNPAY`/`MOMO`/`ZALOPAY` exist in the enum and checkout UI (disabled) for future wiring.