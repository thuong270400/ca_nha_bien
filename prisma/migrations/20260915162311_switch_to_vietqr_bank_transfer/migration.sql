-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'ZALOPAY');
ALTER TABLE "fiship"."orders" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "fiship"."PaymentMethod_old";
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'COD';
COMMIT;

-- DropIndex
DROP INDEX "payments_payosOrderCode_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "checkoutUrl",
DROP COLUMN "expiredAt",
DROP COLUMN "paymentLinkId",
DROP COLUMN "payosOrderCode",
DROP COLUMN "qrCode";

-- DropTable
DROP TABLE "payment_webhook_events";
