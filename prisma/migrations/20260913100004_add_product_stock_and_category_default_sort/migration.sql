-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "defaultSort" TEXT NOT NULL DEFAULT 'newest';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");

-- Backfill: stock is a denormalized sum of variant stock (see product.service.ts),
-- existing rows default to 0 above and need this one-time sync from their variants.
UPDATE "products" p
SET "stock" = COALESCE((SELECT SUM(v."stock") FROM "product_variants" v WHERE v."productId" = p."id"), 0);
