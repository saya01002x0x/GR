-- CreateEnum
CREATE TYPE "ArtworkVisibility" AS ENUM ('PUBLIC', 'TIER_GATED');

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "required_tier_id" TEXT,
ADD COLUMN     "visibility" "ArtworkVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "artworks_required_tier_id_idx" ON "artworks"("required_tier_id");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_required_tier_id_fkey" FOREIGN KEY ("required_tier_id") REFERENCES "artist_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
