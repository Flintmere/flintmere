-- Social-post carousel: ordered Maters slide set on the queue row.
-- Plan: context/plans/2026-07-04-social-post-image.md (approved v2) +
-- context/migrations/2026-07-04-social-post-carousel-images.md.
--
-- Additive only — no data transforms, no existing-column changes:
--
--   1. ALTER scanner_social_posts: adds images (bytea[]) + image_alts (text[]).
--      Array index = display order; slides are ≤950,000-byte PNGs (Bluesky's
--      1MB per-blob limit binds; keeps X on the simple-upload path).
--      Existing rows default to {} / {} — text-only, exact current behaviour.
--      alt_text stays for back-compat but publishing never reads it; per-slide
--      alts are authoritative (accessibility floor: alt required per image).
--
--   2. CHECK constraint: lengths equal + ≤4 (X and Bluesky both cap at 4
--      images). Prisma can't express this; introspection ignores CHECKs, so
--      no drift. cardinality(NULL) → NULL → CHECK passes legacy NULL arrays.

-- AlterTable (prisma migrate diff --script output, verbatim)
ALTER TABLE "scanner_social_posts" ADD COLUMN     "image_alts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" BYTEA[] DEFAULT ARRAY[]::BYTEA[];

-- Slide/alt integrity the schema language can't express
ALTER TABLE "scanner_social_posts"
  ADD CONSTRAINT "scanner_social_posts_images_alts_check"
  CHECK (cardinality("images") = cardinality("image_alts") AND cardinality("images") <= 4);
