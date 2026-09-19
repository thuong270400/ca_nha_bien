-- CreateEnum
CREATE TYPE "SourcingPriceMode" AS ENUM ('FIXED', 'RANGE');

-- CreateTable
CREATE TABLE "product_sourcing_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "catchProcess" TEXT,
    "expectedAvailability" TEXT,
    "depositPercent" INTEGER,
    "priceMode" "SourcingPriceMode" NOT NULL DEFAULT 'FIXED',
    "price" DECIMAL(12,2),
    "minPrice" DECIMAL(12,2),
    "maxPrice" DECIMAL(12,2),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_sourcing_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_sourcing_options_productId_idx" ON "product_sourcing_options"("productId");

-- AddForeignKey
ALTER TABLE "product_sourcing_options" ADD CONSTRAINT "product_sourcing_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
