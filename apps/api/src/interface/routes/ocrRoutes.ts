import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateExtractionSchema } from '@hoop/shared';
import type { OcrService } from '../../infrastructure/ocr/ollamaOcrService';
import {
  OcrConnectionError,
  OcrExtractionError,
} from '../../infrastructure/ocr/ollamaOcrService';
import { extractDocumentData } from '../../application/ocr/extractDocumentData';
import { validateExtraction } from '../../application/ocr/validateExtraction';

interface OcrRoutesDeps {
  readonly ocrService: OcrService;
  readonly prisma: PrismaClient;
}

export async function ocrRoutes(fastify: FastifyInstance, deps: OcrRoutesDeps): Promise<void> {
  fastify.post('/ocr/extract', async (request, reply) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }

    const data = await request.file();
    if (!data) {
      throw new Error('Cannot process request: no file uploaded');
    }

    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;

    try {
      const result = await extractDocumentData(
        { ocrService: deps.ocrService, prisma: deps.prisma },
        clubId,
        buffer,
        mimeType,
      );
      return result;
    } catch (error) {
      if (error instanceof OcrConnectionError) {
        reply.code(503).send({ error: error.message });
        return;
      }
      if (error instanceof OcrExtractionError) {
        fastify.log.error(error, 'OCR extraction failed');
        reply.code(422).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  fastify.patch('/ocr/extractions/:id', async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = validateExtractionSchema.parse(request.body);

    await validateExtraction({ prisma: deps.prisma }, id, clubId, input);

    return { success: true };
  });
}
