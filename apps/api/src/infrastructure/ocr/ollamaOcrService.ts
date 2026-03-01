import { ocrExtractionResultSchema } from '@hoop/shared';
import type { OcrExtractionResult } from '@hoop/shared';

const EXTRACTION_PROMPT = `You are a document data extractor for a basketball club management system.
Look at the document image carefully and extract all visible text into the structured JSON fields.

Instructions:
- Read the document thoroughly. Extract every field you can see printed on it.
- For names: copy the exact spelling as printed. First name goes in firstName, family name goes in lastName.
- For dates: convert to YYYY-MM-DD format.
- For gender: map to G (boy/garçon), F (girl/fille), H (man/homme), D (woman/dame).
- If a field is truly not present on the document, set it to null. But do your best to find each field.
- Do not make up data that is not on the document. Only return what you can actually read.
- If this is a birth certificate or ID, license fields should be null.
- The document may be in French or English.
- Set confidence to "high" if most fields are readable, "medium" for partial, "low" for poor quality.`;

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    player: {
      type: 'object',
      properties: {
        firstName: { type: ['string', 'null'] },
        lastName: { type: ['string', 'null'] },
        birthDate: { type: ['string', 'null'] },
        gender: { type: ['string', 'null'] },
        address: { type: ['string', 'null'] },
        phone: { type: ['string', 'null'] },
        email: { type: ['string', 'null'] },
      },
      required: ['firstName', 'lastName', 'birthDate', 'gender', 'address', 'phone', 'email'],
    },
    license: {
      type: 'object',
      properties: {
        number: { type: ['string', 'null'] },
        category: { type: ['string', 'null'] },
        startDate: { type: ['string', 'null'] },
        endDate: { type: ['string', 'null'] },
      },
      required: ['number', 'category', 'startDate', 'endDate'],
    },
  },
  required: ['confidence', 'player', 'license'],
} as const;

export interface OcrService {
  extract(fileBuffer: Buffer, mimeType: string): Promise<OcrExtractionResult>;
}

export class OcrConnectionError extends Error {
  constructor() {
    super('OCR service is unreachable. Ensure Ollama is running.');
  }
}

export class OcrExtractionError extends Error {}

export function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const { pdf } = await import('pdf-to-img');
  const document = await pdf(pdfBuffer, { scale: 2 });
  for await (const page of document) {
    return Buffer.from(page);
  }
  throw new OcrExtractionError('PDF has no pages');
}

function isOllamaResponse(value: unknown): value is { response: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'response' in value &&
    typeof (value as Record<string, unknown>).response === 'string'
  );
}

export function createOllamaOcrService(baseUrl: string, model: string): OcrService {
  return {
    async extract(fileBuffer: Buffer, mimeType: string): Promise<OcrExtractionResult> {
      let imageBuffer = fileBuffer;
      if (mimeType === 'application/pdf') {
        imageBuffer = await convertPdfToImage(fileBuffer);
      }

      const base64Data = imageBuffer.toString('base64');

      let response: Response;
      try {
        const body = JSON.stringify({
          model,
          prompt: EXTRACTION_PROMPT,
          images: [base64Data],
          format: JSON_SCHEMA,
          stream: false,
          options: { temperature: 0 },
        });
        response = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } catch {
        throw new OcrConnectionError();
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new OcrExtractionError(`Ollama returned ${response.status}: ${body}`);
      }

      const result: unknown = await response.json();
      if (!isOllamaResponse(result)) {
        throw new OcrExtractionError('Ollama returned an unexpected response format');
      }

      const parsed: unknown = JSON.parse(result.response);
      return ocrExtractionResultSchema.parse(parsed);
    },
  };
}
