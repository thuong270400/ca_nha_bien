-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "shippingFee" DECIMAL(12,2) NOT NULL DEFAULT 50000,
    "freeShippingThreshold" DECIMAL(12,2) NOT NULL DEFAULT 500000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
