-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_sourcingClassificationId_fkey";

-- DropIndex
DROP INDEX "products_sourcingClassificationId_idx";

-- AlterTable: replace the classification FK with a plain per-product day count
ALTER TABLE "products" ADD COLUMN "availabilityDays" INTEGER;
ALTER TABLE "products" DROP COLUMN "sourcingClassificationId";

-- DropTable
DROP TABLE "sourcing_classifications";
