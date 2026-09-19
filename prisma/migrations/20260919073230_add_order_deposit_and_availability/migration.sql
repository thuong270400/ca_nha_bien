-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "depositPercent" INTEGER,
ADD COLUMN     "estimatedAvailabilityDays" INTEGER;

-- AlterTable
ALTER TABLE "product_sourcing_options" ADD COLUMN     "expectedAvailabilityDays" INTEGER;
