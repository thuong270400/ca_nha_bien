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

`Product.price`/`compareAtPrice` are **denormalized snapshots of the default `ProductVariant`**, kept in sync by `product.service.ts` (`syncVariants`, `pickDefaultVariant`) on every create/update — this exists because Prisma can't `orderBy`/filter a to-many relation's field directly, and product listing needs to sort/filter by price. `ProductVariant.unit` is a free-form string (not an enum) so new units don't need a migration. `Product.soldCount` is incremented at order-creation time and drives the "best selling" sort/section.

Orders are the only source of truth for money: `order.service.ts#createOrder` re-reads each `ProductVariant.price` from the DB inside a `$transaction`, decrements stock with a `stock: { gte: quantity }` guard on `updateMany` (atomic — throws if insufficient rather than trusting a prior read), and never accepts a client-supplied price. Product/category `DELETE` are soft deletes (`deletedAt`) since `OrderItem`/`CartItem` hold hard FKs to them.

### Cart & guest identity

`server/utils/cart-session.ts#resolveCartId(event)` is the single entry point every cart/order endpoint uses: logged-in → `Cart.userId`; anonymous → an httpOnly `guest_cart_id` cookie mapping to `Cart.sessionId`, auto-created on first use. On login, any existing guest cart's items are merged into the user's cart. Guest order lookup (`GET /api/orders/:id` with no session) is authorized via a separate httpOnly `guest_order_ids` cookie (`server/utils/guest-orders.ts`) set at order-creation time — this is what stops one guest from viewing another guest's order by guessing its id (`order.userId` is `null` for both, so identity can't be checked the normal way).

`app/stores/cart.ts` (Pinia) must call `useRequestFetch()`, not the bare global `$fetch` — plain `$fetch` does not forward the incoming request's cookies during SSR, which silently breaks first-render cart/guest-cookie state. If you add another store/composable that fetches `/api/...` during SSR outside of `useFetch` (which already handles this internally), use `useRequestFetch()` there too.

### Auth

`nuxt-auth-utils` provides the sealed httpOnly session cookie (`setUserSession`/`requireUserSession`/`getUserSession`/`clearUserSession`, `useUserSession()` on the client) — but password hashing uses `bcryptjs` directly in `auth.service.ts`, not the module's built-in scrypt `hashPassword`. Session payload shape is declared in `shared/types/auth.d.ts` (`declare module '#auth-utils'`).

### File uploads

Admin-uploaded product images are written to `uploads/products/` (repo root, **outside** `public/`) by `server/services/upload.service.ts`, and streamed back by `server/routes/uploads/[...path].get.ts`. This split is deliberate: anything under `public/` is snapshotted at `nuxt build` time, so runtime-written files there are invisible to a production build's server — `uploads/` + the streaming route work identically in dev and after a build. Seed/demo images are static SVGs under `public/images/seed/` (fine, since those exist at build time).

### Prisma 7 specifics

- Generator uses the new `prisma-client` provider with `moduleFormat = "cjs"` (see `prisma/schema.prisma`). This is required, not cosmetic: without it, the generated client's `import.meta.url`-based `__dirname` shim gets mis-resolved when Nitro inlines it into the single production bundle, and `node .output/server/index.mjs` crashes on startup on Windows. Don't drop it when touching the generator block.
- No datasource `url` in `schema.prisma` — `prisma.config.ts` supplies it from `DATABASE_URL`. `server/utils/prisma.ts` builds the singleton with `new PrismaPg({ connectionString }, { schema: 'fiship' })` — note `schema` is the **second** constructor argument, not a key merged into the first (that silently no-ops and queries hit `public` instead of `fiship`).
- `prisma.config.ts` also sets `migrations.seed`, which is how `npm run db:seed` finds `prisma/seed.ts`.

### Known deviations from a "textbook" layout

- No `server/repositories/` layer — services call Prisma directly; adding a pass-through repository per model wasn't worth it at this scale.
- No multi-admin management UI yet — `/admin/customers` can lock/unlock a customer but can't promote one to `ADMIN`; that still requires a direct SQL update or editing `prisma/seed.ts`.
- `@nuxt/image` is installed but unused (plain `<img loading="lazy">` throughout) — wiring its IPX provider to both `public/images/` and the external `uploads/` dir was judged not worth the risk/time.
- Only `PaymentMethod.COD` has real handling; `VNPAY`/`MOMO`/`ZALOPAY` exist in the enum and checkout UI (disabled) for future wiring.