-- CreateEnum
CREATE TYPE "SuggestedDishVideoType" AS ENUM ('YOUTUBE', 'MP4', 'OTHER');

-- CreateTable
CREATE TABLE "suggested_dishes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "videoType" "SuggestedDishVideoType",
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggested_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suggested_dishes_productId_idx" ON "suggested_dishes"("productId");

-- AddForeignKey
ALTER TABLE "suggested_dishes" ADD CONSTRAINT "suggested_dishes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
