-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'PAYOS';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bankSnapshot" JSONB,
ADD COLUMN     "checkoutUrl" TEXT,
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkId" TEXT,
ADD COLUMN     "payosOrderCode" SERIAL NOT NULL,
ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYOS',
    "reference" TEXT NOT NULL,
    "orderCode" INTEGER NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_reference_key" ON "payment_webhook_events"("provider", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payosOrderCode_key" ON "payments"("payosOrderCode");
