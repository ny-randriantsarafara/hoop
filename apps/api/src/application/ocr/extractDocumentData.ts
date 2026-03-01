import type { PrismaClient } from '@prisma/client';
import type { OcrExtractionResponse } from '@hoop/shared';
import type { OcrService } from '../../infrastructure/ocr/ollamaOcrService';
import { isSupportedMimeType } from '../../infrastructure/ocr/ollamaOcrService';

export interface ExtractDocumentDataDeps {
  readonly ocrService: OcrService;
  readonly prisma: PrismaClient;
}

export async function extractDocumentData(
  deps: ExtractDocumentDataDeps,
  clubId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<OcrExtractionResponse> {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error('Unsupported file type. Accepted: JPEG, PNG, WebP, PDF');
  }

  const result = await deps.ocrService.extract(fileBuffer, mimeType);

  const extraction = await deps.prisma.ocrExtraction.create({
    data: {
      clubId,
      originalFile: new Uint8Array(fileBuffer),
      mimeType,
      extractedData: result,
    },
  });

  return {
    extractionId: extraction.id,
    ...result,
  };
}
