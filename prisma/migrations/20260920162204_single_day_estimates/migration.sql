-- AlterTable: sourcing_classifications — collapse from/to day range into a single approximate day count
ALTER TABLE "sourcing_classifications" ADD COLUMN "availabilityDays" INTEGER;
UPDATE "sourcing_classifications" SET "availabilityDays" = COALESCE("availabilityToDays", "availabilityFromDays");
ALTER TABLE "sourcing_classifications" DROP COLUMN "availabilityFromDays",
DROP COLUMN "availabilityToDays";

-- AlterTable: order_items — same collapse for the per-item snapshot
ALTER TABLE "order_items" ADD COLUMN "availabilityDays" INTEGER;
UPDATE "order_items" SET "availabilityDays" = COALESCE("availabilityToDays", "availabilityFromDays");
ALTER TABLE "order_items" DROP COLUMN "availabilityFromDays",
DROP COLUMN "availabilityToDays";

-- AlterTable: settings — same collapse for the site-wide delivery estimate
ALTER TABLE "settings" ADD COLUMN "deliveryDays" INTEGER;
UPDATE "settings" SET "deliveryDays" = COALESCE("deliveryToDays", "deliveryFromDays");
ALTER TABLE "settings" DROP COLUMN "deliveryFromDays",
DROP COLUMN "deliveryToDays";
