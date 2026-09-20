-- AlterTable
ALTER TABLE "sourcing_classifications" DROP COLUMN "deliveryFromDays",
DROP COLUMN "deliveryToDays";

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "deliveryFromDays" INTEGER,
ADD COLUMN     "deliveryToDays" INTEGER;
