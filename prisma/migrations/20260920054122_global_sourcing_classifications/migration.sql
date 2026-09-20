-- DropForeignKey
ALTER TABLE "product_sourcing_options" DROP CONSTRAINT "product_sourcing_options_productId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sourcingClassificationId" TEXT;

-- DropTable
DROP TABLE "product_sourcing_options";

-- CreateTable
CREATE TABLE "sourcing_classifications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "catchProcess" TEXT,
    "availabilityFromDays" INTEGER,
    "availabilityToDays" INTEGER,
    "deliveryFromDays" INTEGER,
    "deliveryToDays" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_classifications_slug_key" ON "sourcing_classifications"("slug");

-- CreateIndex
CREATE INDEX "sourcing_classifications_slug_idx" ON "sourcing_classifications"("slug");

-- CreateIndex
CREATE INDEX "products_sourcingClassificationId_idx" ON "products"("sourcingClassificationId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sourcingClassificationId_fkey" FOREIGN KEY ("sourcingClassificationId") REFERENCES "sourcing_classifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
