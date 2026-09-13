-- CreateEnum
CREATE TYPE "SocialLinkDisplay" AS ENUM ('FOOTER', 'FIXED');

-- AlterTable
ALTER TABLE "social_links" ADD COLUMN     "displayLocation" "SocialLinkDisplay" NOT NULL DEFAULT 'FOOTER';
