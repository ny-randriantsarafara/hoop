-- CreateTable
CREATE TABLE "ocr_extractions" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "original_file" BYTEA NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "validated_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_extractions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ocr_extractions" ADD CONSTRAINT "ocr_extractions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
