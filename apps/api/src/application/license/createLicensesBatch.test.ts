import { describe, it, expect, vi } from 'vitest';
import { createLicensesBatch } from './createLicensesBatch';

const baseInput = {
  playerId: 'player-1',
  seasonId: 'season-1',
  number: 'LIC-001',
  status: 'active' as const,
  category: 'U14',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
};

const mockPlayer = { id: 'player-1', clubId: 'club-1' };
const mockSeason = { id: 'season-1', label: '2025' };

function createDeps(overrides: { missingPlayerId?: string } = {}) {
  return {
    licenseRepository: {
      create: vi.fn().mockImplementation((input) =>
        Promise.resolve({
          id: `lic-${input.number}`,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findById: vi.fn(),
      findMany: vi.fn(),
      findManyWithRelations: vi.fn(),
      findActiveByPlayerId: vi.fn(),
      countBySeason: vi.fn(),
      getNextSequenceNumber: vi.fn(),
    },
    playerRepository: {
      findById: vi
        .fn()
        .mockImplementation((id) =>
          Promise.resolve(id === overrides.missingPlayerId ? null : mockPlayer),
        ),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countByClub: vi.fn(),
    },
    seasonRepository: {
      findById: vi.fn().mockResolvedValue(mockSeason),
      findAll: vi.fn(),
      findActive: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deactivateAll: vi.fn(),
    },
  };
}

describe('createLicensesBatch', () => {
  it('creates multiple licenses', async () => {
    const deps = createDeps();
    const inputs = [
      { ...baseInput, number: 'LIC-001' },
      { ...baseInput, number: 'LIC-002' },
    ];

    const results = await createLicensesBatch(deps, inputs);

    expect(results).toHaveLength(2);
    expect(deps.licenseRepository.create).toHaveBeenCalledTimes(2);
  });

  it('throws and stops on first missing player', async () => {
    const deps = createDeps({ missingPlayerId: 'missing-player' });
    const inputs = [
      { ...baseInput, playerId: 'missing-player', number: 'LIC-001' },
      { ...baseInput, number: 'LIC-002' },
    ];

    await expect(createLicensesBatch(deps, inputs)).rejects.toThrow(
      'Player missing-player not found',
    );
    expect(deps.licenseRepository.create).not.toHaveBeenCalled();
  });
});
