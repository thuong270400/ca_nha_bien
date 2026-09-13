-- CreateEnum
CREATE TYPE "SocialLinkIconType" AS ENUM ('PRESET', 'CUSTOM');

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "iconType" "SocialLinkIconType" NOT NULL DEFAULT 'PRESET',
    "iconKey" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_links_isActive_idx" ON "social_links"("isActive");
