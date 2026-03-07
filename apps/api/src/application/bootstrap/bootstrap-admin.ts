import bcrypt from 'bcrypt';

const BOOTSTRAP_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const PASSWORD_SALT_ROUNDS = 10;

const DEFAULT_BOOTSTRAP_VALUES = {
  adminName: 'Admin Club',
  clubName: 'BC Analamanga',
  clubSection: 'Masculine',
  clubEmail: 'contact@bcanalamanga.mg',
  clubPhone: '+261 34 00 000 00',
  clubAddress: 'Antananarivo, Madagascar',
} as const;

export type BootstrapAdminResult =
  | { status: 'skipped'; reason: 'missing-admin-credentials' }
  | { status: 'bootstrapped'; clubId: string; email: string };

type BootstrapAdminLogger = {
  info: (message: string) => void;
};

type BootstrapTransaction = {
  club: {
    upsert: (args: {
      where: { id: string };
      update: {
        name: string;
        section: string;
        address: string;
        phone: string;
        email: string;
      };
      create: {
        id: string;
        name: string;
        section: string;
        address: string;
        phone: string;
        email: string;
      };
    }) => Promise<{ id: string }>;
  };
  user: {
    upsert: (args: {
      where: { email: string };
      update: {
        name: string;
        passwordHash: string;
        role: 'admin';
        clubId: string;
      };
      create: {
        name: string;
        email: string;
        passwordHash: string;
        role: 'admin';
        clubId: string;
      };
    }) => Promise<unknown>;
  };
};

type BootstrapAdminPrisma = {
  $transaction: <T>(callback: (tx: BootstrapTransaction) => Promise<T>) => Promise<T>;
};

export type BootstrapAdminDeps = {
  prisma: BootstrapAdminPrisma;
  env?: NodeJS.ProcessEnv;
  logger?: BootstrapAdminLogger;
};

type BootstrapAdminConfig = {
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  clubName: string;
  clubSection: string;
  clubEmail: string;
  clubPhone: string;
  clubAddress: string;
};

function readValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function readBootstrapConfig(env: NodeJS.ProcessEnv): BootstrapAdminConfig | null {
  const adminEmail = env.ADMIN_EMAIL?.trim();
  const adminPassword = env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    return null;
  }

  return {
    adminEmail,
    adminPassword,
    adminName: readValue(env.ADMIN_NAME, DEFAULT_BOOTSTRAP_VALUES.adminName),
    clubName: readValue(env.ADMIN_CLUB_NAME, DEFAULT_BOOTSTRAP_VALUES.clubName),
    clubSection: readValue(env.ADMIN_CLUB_SECTION, DEFAULT_BOOTSTRAP_VALUES.clubSection),
    clubEmail: readValue(env.ADMIN_CLUB_EMAIL, DEFAULT_BOOTSTRAP_VALUES.clubEmail),
    clubPhone: readValue(env.ADMIN_CLUB_PHONE, DEFAULT_BOOTSTRAP_VALUES.clubPhone),
    clubAddress: readValue(env.ADMIN_CLUB_ADDRESS, DEFAULT_BOOTSTRAP_VALUES.clubAddress),
  };
}

export async function bootstrapAdmin({
  prisma,
  env = process.env,
  logger = console,
}: BootstrapAdminDeps): Promise<BootstrapAdminResult> {
  const config = readBootstrapConfig(env);

  if (!config) {
    logger.info('Skipping admin bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD is not configured.');
    return { status: 'skipped', reason: 'missing-admin-credentials' };
  }

  const passwordHash = await bcrypt.hash(config.adminPassword, PASSWORD_SALT_ROUNDS);

  const clubId = await prisma.$transaction(async (tx) => {
    const club = await tx.club.upsert({
      where: { id: BOOTSTRAP_CLUB_ID },
      update: {
        name: config.clubName,
        section: config.clubSection,
        address: config.clubAddress,
        phone: config.clubPhone,
        email: config.clubEmail,
      },
      create: {
        id: BOOTSTRAP_CLUB_ID,
        name: config.clubName,
        section: config.clubSection,
        address: config.clubAddress,
        phone: config.clubPhone,
        email: config.clubEmail,
      },
    });

    await tx.user.upsert({
      where: { email: config.adminEmail },
      update: {
        name: config.adminName,
        passwordHash,
        role: 'admin',
        clubId: club.id,
      },
      create: {
        name: config.adminName,
        email: config.adminEmail,
        passwordHash,
        role: 'admin',
        clubId: club.id,
      },
    });

    return club.id;
  });

  logger.info(`Bootstrapped admin user ${config.adminEmail} for club ${clubId}.`);

  return {
    status: 'bootstrapped',
    clubId,
    email: config.adminEmail,
  };
}
