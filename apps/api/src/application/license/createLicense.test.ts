import { describe, it, expect, vi } from 'vitest';
import { createLicense } from './createLicense';
import type { LicenseEntity } from '../../domain/license/licenseEntity';

const mockInput = {
  playerId: 'player-1',
  seasonId: 'season-1',
  number: 'LIC-001',
  status: 'active' as const,
  category: 'U14',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
};

const mockLicense: LicenseEntity = {
  id: 'license-1',
  ...mockInput,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPlayer = { id: 'player-1', clubId: 'club-1' };
const mockSeason = { id: 'season-1', label: '2025' };

function createDeps(overrides: { playerExists?: boolean; seasonExists?: boolean } = {}) {
  const { playerExists = true, seasonExists = true } = overrides;
  return {
    licenseRepository: {
      create: vi.fn().mockResolvedValue(mockLicense),
      findById: vi.fn(),
      findMany: vi.fn(),
      findManyWithRelations: vi.fn(),
      count: vi.fn(),
    },
    playerRepository: {
      findById: vi.fn().mockResolvedValue(playerExists ? mockPlayer : null),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    seasonRepository: {
      findById: vi.fn().mockResolvedValue(seasonExists ? mockSeason : null),
      findAll: vi.fn(),
      findActive: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deactivateAll: vi.fn(),
    },
  };
}

describe('createLicense', () => {
  it('creates a license when player and season exist', async () => {
    const deps = createDeps();

    const result = await createLicense(deps, mockInput);

    expect(deps.playerRepository.findById).toHaveBeenCalledWith('player-1');
    expect(deps.seasonRepository.findById).toHaveBeenCalledWith('season-1');
    expect(deps.licenseRepository.create).toHaveBeenCalledWith(mockInput);
    expect(result).toEqual(mockLicense);
  });

  it('throws when player does not exist', async () => {
    const deps = createDeps({ playerExists: false });

    await expect(createLicense(deps, mockInput)).rejects.toThrow('Player not found');
    expect(deps.licenseRepository.create).not.toHaveBeenCalled();
  });

  it('throws when season does not exist', async () => {
    const deps = createDeps({ seasonExists: false });

    await expect(createLicense(deps, mockInput)).rejects.toThrow('Season not found');
    expect(deps.licenseRepository.create).not.toHaveBeenCalled();
  });
});
