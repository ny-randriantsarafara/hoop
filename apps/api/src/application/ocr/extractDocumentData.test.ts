import { describe, it, expect, vi } from 'vitest';
import { extractDocumentData } from './extractDocumentData';
import type { OcrExtractionResult } from '@hoop/shared';
import type { OcrService } from '../../infrastructure/ocr/ollamaOcrService';

const mockExtractionResult: OcrExtractionResult = {
  confidence: 'high',
  player: {
    firstName: 'Jean',
    lastName: 'Dupont',
    birthDate: '2010-05-15',
    gender: 'G',
    address: '12 Rue de Paris',
    phone: null,
    email: null,
  },
  license: {
    number: 'LIC-2025-001',
    category: 'U14',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
};

const mockOcrService: OcrService = {
  extract: vi.fn().mockResolvedValue(mockExtractionResult),
};

const mockPrisma = {
  ocrExtraction: {
    create: vi.fn().mockResolvedValue({
      id: 'extraction-1',
      clubId: 'club-1',
      mimeType: 'image/jpeg',
      extractedData: mockExtractionResult,
      validatedData: null,
      createdAt: new Date(),
    }),
  },
} as never;

describe('extractDocumentData', () => {
  it('extracts data from a supported file and stores extraction', async () => {
    const buffer = Buffer.from('fake-image-data');

    const result = await extractDocumentData(
      { ocrService: mockOcrService, prisma: mockPrisma },
      'club-1',
      buffer,
      'image/jpeg',
    );

    expect(mockOcrService.extract).toHaveBeenCalledWith(buffer, 'image/jpeg');
    expect(mockPrisma.ocrExtraction.create).toHaveBeenCalledWith({
      data: {
        clubId: 'club-1',
        originalFile: new Uint8Array(buffer),
        mimeType: 'image/jpeg',
        extractedData: mockExtractionResult,
      },
    });
    expect(result.extractionId).toBe('extraction-1');
    expect(result.confidence).toBe('high');
    expect(result.player.firstName).toBe('Jean');
  });

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('fake-data');

    await expect(
      extractDocumentData(
        { ocrService: mockOcrService, prisma: mockPrisma },
        'club-1',
        buffer,
        'text/plain',
      ),
    ).rejects.toThrow('Unsupported file type');
  });

  it('accepts PDF files', async () => {
    const buffer = Buffer.from('fake-pdf-data');

    const result = await extractDocumentData(
      { ocrService: mockOcrService, prisma: mockPrisma },
      'club-1',
      buffer,
      'application/pdf',
    );

    expect(mockOcrService.extract).toHaveBeenCalledWith(buffer, 'application/pdf');
    expect(result.extractionId).toBe('extraction-1');
  });

  it('accepts PNG files', async () => {
    const buffer = Buffer.from('fake-png-data');

    const result = await extractDocumentData(
      { ocrService: mockOcrService, prisma: mockPrisma },
      'club-1',
      buffer,
      'image/png',
    );

    expect(mockOcrService.extract).toHaveBeenCalledWith(buffer, 'image/png');
    expect(result.extractionId).toBe('extraction-1');
  });
});
