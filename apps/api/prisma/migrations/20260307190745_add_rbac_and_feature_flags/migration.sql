-- AlterEnum: Update Role enum to have admin, staff, viewer values
-- PostgreSQL requires a workaround since we can't modify enum values directly in a transaction

-- Create new enum type with desired values
CREATE TYPE "Role_new" AS ENUM ('admin', 'staff', 'viewer');

-- Update the column to use the new enum (converting adminClub -> admin)
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE 
    WHEN "role"::text = 'adminClub' THEN 'admin'::"Role_new"
    ELSE "role"::text::"Role_new"
  END
);

-- Drop the old enum
DROP TYPE "Role";

-- Rename new enum to original name
ALTER TYPE "Role_new" RENAME TO "Role";

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_club_id_key_key" ON "feature_flags"("club_id", "key");

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
