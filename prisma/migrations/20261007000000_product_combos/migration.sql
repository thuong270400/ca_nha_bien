-- AlterTable
ALTER TABLE "products" ADD COLUMN     "comboDiscount" DECIMAL(12,2),
ADD COLUMN     "isCombo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "comboItems" JSONB;

-- CreateTable
CREATE TABLE "combo_items" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "combo_items_variantId_idx" ON "combo_items"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "combo_items_comboId_variantId_key" ON "combo_items"("comboId", "variantId");

-- CreateIndex
CREATE INDEX "products_isCombo_idx" ON "products"("isCombo");

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

