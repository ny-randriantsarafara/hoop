import { describe, it, expect, vi } from 'vitest';
import { createPrismaLicenseRepository } from './license.repository';

const validInput = {
  playerId: 'player-1',
  seasonId: 'season-1',
  categoryId: 'category-1',
  number: 'LIC-001',
  status: 'active' as const,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
};

function createPrismaMock() {
  return {
    license: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe('createPrismaLicenseRepository', () => {
  it('maps unique number violations to a clear domain error', async () => {
    const prisma = createPrismaMock();
    const duplicateNumberError = Object.assign(
      new Error('Unique constraint failed on the fields: (`number`)'),
      { code: 'P2002', meta: { target: ['number'] } },
    );
    prisma.license.create.mockRejectedValue(duplicateNumberError);

    const repository = createPrismaLicenseRepository(prisma as never);

    await expect(repository.create(validInput)).rejects.toThrow('License number already exists');
  });
});
