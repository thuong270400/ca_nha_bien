-- CreateTable
CREATE TABLE "coupon_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_categories_slug_key" ON "coupon_categories"("slug");

-- CreateIndex
CREATE INDEX "coupon_categories_slug_idx" ON "coupon_categories"("slug");

-- Backfill: create a default coupon category so existing coupons have somewhere
-- to land, since Coupon.categoryId is NOT NULL (every coupon belongs to exactly
-- one category).
INSERT INTO "coupon_categories" ("id", "name", "slug", "updatedAt")
VALUES ('default', 'Chung', 'chung', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "categoryId" TEXT;
UPDATE "coupons" SET "categoryId" = 'default' WHERE "categoryId" IS NULL;
ALTER TABLE "coupons" ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "coupons_categoryId_idx" ON "coupons"("categoryId");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "coupon_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "order_coupons" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "couponId" TEXT,
    "couponCode" TEXT NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_coupons_orderId_idx" ON "order_coupons"("orderId");

-- AddForeignKey
ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: carry any existing single-coupon order data (Order.couponId/couponCode)
-- into the new order_coupons join table before dropping those columns below.
INSERT INTO "order_coupons" ("id", "orderId", "couponId", "couponCode", "discountAmount")
SELECT gen_random_uuid()::text, "id", "couponId", "couponCode", "discountAmount"
FROM "orders"
WHERE "couponCode" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_couponId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "couponCode",
DROP COLUMN "couponId";
