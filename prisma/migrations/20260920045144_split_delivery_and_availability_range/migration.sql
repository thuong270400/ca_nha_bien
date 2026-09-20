-- CreateEnum
CREATE TYPE "OrderDeliveryMode" AS ENUM ('SINGLE', 'SPLIT');

-- AlterTable
ALTER TABLE "product_sourcing_options" DROP COLUMN "expectedAvailability",
DROP COLUMN "expectedAvailabilityDays",
ADD COLUMN     "availabilityFromDays" INTEGER,
ADD COLUMN     "availabilityToDays" INTEGER,
ADD COLUMN     "deliveryFromDays" INTEGER,
ADD COLUMN     "deliveryToDays" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryMode" "OrderDeliveryMode" NOT NULL DEFAULT 'SINGLE';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "availabilityFromDays" INTEGER,
ADD COLUMN     "availabilityToDays" INTEGER;
