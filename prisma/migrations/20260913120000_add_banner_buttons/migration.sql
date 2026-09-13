-- CreateTable
CREATE TABLE "banner_buttons" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "banner_buttons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banner_buttons_bannerId_idx" ON "banner_buttons"("bannerId");

-- AddForeignKey
ALTER TABLE "banner_buttons" ADD CONSTRAINT "banner_buttons_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve each banner's existing single CTA (ctaLabel/ctaLink) as its first button
-- before the old columns are dropped below.
INSERT INTO "banner_buttons" ("id", "bannerId", "label", "link", "position")
SELECT gen_random_uuid()::text, "id", "ctaLabel", "ctaLink", 0
FROM "banners"
WHERE "ctaLabel" IS NOT NULL AND "ctaLabel" != '' AND "ctaLink" IS NOT NULL AND "ctaLink" != '';

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "ctaLabel",
DROP COLUMN "ctaLink";
