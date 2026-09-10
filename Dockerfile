# syntax=docker/dockerfile:1

# Fiship — Nuxt 4 full-stack app (Nitro server IS the backend, server/ is not
# a separate service). One image, two purposes: it runs the app
# (`node .output/server/index.mjs`) and doubles as the Prisma CLI runner for
# one-off `docker compose run --rm app npx prisma migrate deploy` /
# `... db seed` commands — see docker-compose.yml. That's why the runtime
# stage keeps full node_modules (incl. the `prisma`/`tsx` devDependencies)
# instead of a pruned production-only install.

FROM node:22-bookworm-slim AS build
WORKDIR /app

# ca-certificates: `prisma generate` (run via postinstall) downloads engine
# binaries over HTTPS. openssl: the Prisma schema-engine binary links against
# libssl at runtime, which Debian "slim" doesn't ship by default.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy the whole context (see .dockerignore for exclusions — notably
# node_modules and server/generated/prisma, so nothing from the Windows dev
# host ever leaks in) before `npm ci`. Several transitive deps (esbuild,
# tailwindcss' oxide/lightningcss native binaries, @prisma/engines) fetch or
# select their binary during their own postinstall scripts, so `--ignore-scripts`
# is not safe here, and postinstall itself runs `nuxt prepare && prisma generate`,
# which need the real project files present.
COPY . .
RUN npm ci

ENV NODE_ENV=production
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Running the app only needs .output — Nitro's build already inlines the
# local server/generated/prisma client code into .output/server/chunks, and
# separately traces @prisma/client, @prisma/adapter-pg and pg (marked
# external in nuxt.config.ts's nitro.externals) into .output/server/node_modules,
# so .output alone is self-contained for `node .output/server/index.mjs`
# (verified against a real build — no reliance on the full node_modules below).
#
# The full node_modules + prisma/ + prisma.config.ts are for the *separate*
# one-off `docker compose run --rm app npx prisma migrate deploy` / `db seed`
# commands: the `prisma` CLI + schema-engine binary are devDependencies never
# traced by Nitro. `db seed` specifically runs `tsx prisma/seed.ts`, which
# imports server/utils/prisma.ts -> server/generated/prisma/client as plain
# files resolved from disk (tsx doesn't bundle) — hence copying ./server too,
# not just ./prisma.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/package.json ./package.json

# `node` user (uid 1000) already exists in the official Node image.
USER node

EXPOSE 3000

# /api/health (server/api/health.get.ts) does a real prisma.category.count(),
# so this also catches a broken DB connection, not just process liveness.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
