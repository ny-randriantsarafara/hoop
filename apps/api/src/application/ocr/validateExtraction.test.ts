import { describe, it, expect, vi } from 'vitest';
import { validateExtraction } from './validateExtraction';

const mockExtraction = {
  id: 'extraction-1',
  clubId: 'club-1',
  mimeType: 'image/jpeg',
  extractedData: {},
  validatedData: null,
  createdAt: new Date(),
};

function createMockPrisma(extraction: typeof mockExtraction | null) {
  return {
    ocrExtraction: {
      findUnique: vi.fn().mockResolvedValue(extraction),
      update: vi.fn().mockResolvedValue({ ...extraction, validatedData: {} }),
    },
  } as never;
}

const validInput = {
  validatedData: {
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
      number: null,
      category: null,
      startDate: null,
      endDate: null,
    },
  },
};

describe('validateExtraction', () => {
  it('updates validated data for a matching extraction', async () => {
    const prisma = createMockPrisma(mockExtraction);

    await validateExtraction({ prisma }, 'extraction-1', 'club-1', validInput);

    expect(prisma.ocrExtraction.findUnique).toHaveBeenCalledWith({
      where: { id: 'extraction-1' },
    });
    expect(prisma.ocrExtraction.update).toHaveBeenCalledWith({
      where: { id: 'extraction-1' },
      data: { validatedData: validInput.validatedData },
    });
  });

  it('throws when extraction does not exist', async () => {
    const prisma = createMockPrisma(null);

    await expect(
      validateExtraction({ prisma }, 'extraction-1', 'club-1', validInput),
    ).rejects.toThrow('Extraction not found');
  });

  it('throws when extraction belongs to a different club', async () => {
    const prisma = createMockPrisma(mockExtraction);

    await expect(
      validateExtraction({ prisma }, 'extraction-1', 'other-club', validInput),
    ).rejects.toThrow('Extraction not found');
  });
});
