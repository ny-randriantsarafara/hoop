-- Add nullable relation column first
ALTER TABLE "licenses" ADD COLUMN "category_id" TEXT;

-- Fail early if category names are ambiguous per club when normalized
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "category_configs"
    GROUP BY "club_id", lower(trim("name"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot migrate licenses.category to category_id: ambiguous category names found per club';
  END IF;
END $$;

-- Backfill relation by matching old license category name to club category config
UPDATE "licenses" l
SET "category_id" = c."id"
FROM "players" p,
     "category_configs" c
WHERE l."player_id" = p."id"
  AND c."club_id" = p."club_id"
  AND lower(trim(c."name")) = lower(trim(l."category"));

-- Fail if any row could not be mapped
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "licenses" WHERE "category_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate licenses.category to category_id: unmatched license categories remain';
  END IF;
END $$;

-- Enforce integrity
ALTER TABLE "licenses" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "licenses"
  ADD CONSTRAINT "licenses_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "category_configs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove legacy string column
ALTER TABLE "licenses" DROP COLUMN "category";
