-- AlterTable
ALTER TABLE "products" ADD COLUMN     "compareAtPrice" DECIMAL(12,2),
ADD COLUMN     "price" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");
