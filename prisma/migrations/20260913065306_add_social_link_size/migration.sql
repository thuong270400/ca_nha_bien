-- CreateEnum
CREATE TYPE "SocialLinkSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "social_links" ADD COLUMN     "size" "SocialLinkSize" NOT NULL DEFAULT 'MEDIUM';
