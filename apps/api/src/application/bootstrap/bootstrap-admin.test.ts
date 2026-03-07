import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { bootstrapAdmin } from './bootstrap-admin';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn() },
}));

type MockTransaction = {
  club: {
    upsert: ReturnType<typeof vi.fn>;
  };
  user: {
    upsert: ReturnType<typeof vi.fn>;
  };
};

function createDeps(envOverrides: Record<string, string | undefined> = {}) {
  const tx: MockTransaction = {
    club: {
      upsert: vi.fn().mockResolvedValue({ id: 'club-1' }),
    },
    user: {
      upsert: vi.fn().mockResolvedValue({ id: 'user-1' }),
    },
  };

  const prisma = {
    $transaction: vi.fn().mockImplementation(async (callback: (client: MockTransaction) => unknown) => {
      return callback(tx);
    }),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  return {
    deps: {
      prisma,
      logger,
      env: {
        ADMIN_EMAIL: 'admin@test.mg',
        ADMIN_PASSWORD: 'password123',
        ADMIN_NAME: 'Club Admin',
        ADMIN_CLUB_NAME: 'Test Club',
        ADMIN_CLUB_SECTION: 'Masculine',
        ADMIN_CLUB_EMAIL: 'contact@test.mg',
        ADMIN_CLUB_PHONE: '+261 34 00 000 00',
        ADMIN_CLUB_ADDRESS: 'Antananarivo, Madagascar',
        ...envOverrides,
      },
    },
    prisma,
    tx,
    logger,
  };
}

describe('bootstrapAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips when admin credentials are missing', async () => {
    const { deps, prisma, tx, logger } = createDeps({ ADMIN_PASSWORD: undefined });

    const result = await bootstrapAdmin(deps);

    expect(result).toEqual({ status: 'skipped', reason: 'missing-admin-credentials' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.club.upsert).not.toHaveBeenCalled();
    expect(tx.user.upsert).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Skipping admin bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD is not configured.',
    );
  });

  it('creates the club and admin user when missing', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('$2b$10$hashed' as never);
    const { deps, prisma, tx } = createDeps();

    const result = await bootstrapAdmin(deps);

    expect(result).toEqual({ status: 'bootstrapped', clubId: 'club-1', email: 'admin@test.mg' });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.club.upsert).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {
        address: 'Antananarivo, Madagascar',
        email: 'contact@test.mg',
        name: 'Test Club',
        phone: '+261 34 00 000 00',
        section: 'Masculine',
      },
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        address: 'Antananarivo, Madagascar',
        email: 'contact@test.mg',
        name: 'Test Club',
        phone: '+261 34 00 000 00',
        section: 'Masculine',
      },
    });
    expect(tx.user.upsert).toHaveBeenCalledWith({
      where: { email: 'admin@test.mg' },
      update: {
        clubId: 'club-1',
        name: 'Club Admin',
        passwordHash: '$2b$10$hashed',
        role: 'adminClub',
      },
      create: {
        clubId: 'club-1',
        email: 'admin@test.mg',
        name: 'Club Admin',
        passwordHash: '$2b$10$hashed',
        role: 'adminClub',
      },
    });
  });

  it('updates an existing admin and links it to the configured club', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('$2b$10$new-hash' as never);
    const { deps, tx } = createDeps({ ADMIN_NAME: 'Updated Admin' });
    tx.club.upsert.mockResolvedValue({ id: 'club-42' });

    await bootstrapAdmin(deps);

    expect(tx.user.upsert).toHaveBeenCalledWith({
      where: { email: 'admin@test.mg' },
      update: {
        clubId: 'club-42',
        name: 'Updated Admin',
        passwordHash: '$2b$10$new-hash',
        role: 'adminClub',
      },
      create: {
        clubId: 'club-42',
        email: 'admin@test.mg',
        name: 'Updated Admin',
        passwordHash: '$2b$10$new-hash',
        role: 'adminClub',
      },
    });
  });

  it('falls back to the seeded defaults when optional club values are missing', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('$2b$10$seed-hash' as never);
    const { deps, tx } = createDeps({
      ADMIN_NAME: undefined,
      ADMIN_CLUB_NAME: undefined,
      ADMIN_CLUB_SECTION: undefined,
      ADMIN_CLUB_EMAIL: undefined,
      ADMIN_CLUB_PHONE: undefined,
      ADMIN_CLUB_ADDRESS: undefined,
    });

    await bootstrapAdmin(deps);

    expect(tx.club.upsert).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {
        address: 'Antananarivo, Madagascar',
        email: 'contact@bcanalamanga.mg',
        name: 'BC Analamanga',
        phone: '+261 34 00 000 00',
        section: 'Masculine',
      },
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        address: 'Antananarivo, Madagascar',
        email: 'contact@bcanalamanga.mg',
        name: 'BC Analamanga',
        phone: '+261 34 00 000 00',
        section: 'Masculine',
      },
    });
    expect(tx.user.upsert).toHaveBeenCalledWith({
      where: { email: 'admin@test.mg' },
      update: {
        clubId: 'club-1',
        name: 'Admin Club',
        passwordHash: '$2b$10$seed-hash',
        role: 'adminClub',
      },
      create: {
        clubId: 'club-1',
        email: 'admin@test.mg',
        name: 'Admin Club',
        passwordHash: '$2b$10$seed-hash',
        role: 'adminClub',
      },
    });
  });
});
