-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DEPOSIT_PAID';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "depositAmount" DECIMAL(12,2),
ADD COLUMN     "depositPaidAt" TIMESTAMP(3);
