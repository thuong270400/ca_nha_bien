#!/bin/sh
# Runs once, only against a brand-new (empty) data volume, via Postgres'
# docker-entrypoint-initdb.d convention. Prisma Migrate is generally able to
# create the schema named in DATABASE_URL's ?schema= param itself on first
# `migrate deploy`, but creating it here too is cheap and removes any doubt —
# migrations then just run against a schema that already exists.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA:-fiship}";
EOSQL
