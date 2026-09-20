-- AlterTable
ALTER TABLE "product_sourcing_options" DROP COLUMN "depositPercent";

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "depositPercent" INTEGER NOT NULL DEFAULT 0;
