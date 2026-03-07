ALTER TABLE "category_configs"
ADD COLUMN "gender" "Gender";

UPDATE "category_configs"
SET "gender" = 'G'
WHERE "gender" IS NULL;

ALTER TABLE "category_configs"
ALTER COLUMN "gender" SET NOT NULL;
