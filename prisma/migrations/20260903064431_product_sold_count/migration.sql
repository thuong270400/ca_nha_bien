-- AlterTable
ALTER TABLE "products" ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_soldCount_idx" ON "products"("soldCount");
