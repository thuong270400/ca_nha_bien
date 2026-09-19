-- AlterTable
ALTER TABLE "product_sourcing_options" DROP COLUMN "maxPrice",
DROP COLUMN "minPrice",
DROP COLUMN "price",
DROP COLUMN "priceMode";

-- DropEnum
DROP TYPE "SourcingPriceMode";
