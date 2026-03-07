import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const season = await prisma.season.upsert({
    where: { label: '2025' },
    update: {},
    create: {
      label: '2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      active: true,
    },
  });

  const club = await prisma.club.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'BC Analamanga',
      section: 'Masculine',
      address: 'Antananarivo, Madagascar',
      phone: '+261 34 00 000 00',
      email: 'contact@bcanalamanga.mg',
    },
  });

  const defaultCategories = [
    { name: 'U10', gender: 'G' as const, minAge: 0, maxAge: 10 },
    { name: 'U10', gender: 'F' as const, minAge: 0, maxAge: 10 },
    { name: 'U12', gender: 'G' as const, minAge: 11, maxAge: 12 },
    { name: 'U12', gender: 'F' as const, minAge: 11, maxAge: 12 },
    { name: 'U14', gender: 'G' as const, minAge: 13, maxAge: 14 },
    { name: 'U14', gender: 'F' as const, minAge: 13, maxAge: 14 },
    { name: 'U16', gender: 'G' as const, minAge: 15, maxAge: 16 },
    { name: 'U16', gender: 'F' as const, minAge: 15, maxAge: 16 },
    { name: 'U18', gender: 'G' as const, minAge: 17, maxAge: 18 },
    { name: 'U18', gender: 'F' as const, minAge: 17, maxAge: 18 },
    { name: 'U20', gender: 'G' as const, minAge: 19, maxAge: 20 },
    { name: 'U20', gender: 'F' as const, minAge: 19, maxAge: 20 },
    { name: 'Senior', gender: 'H' as const, minAge: 21, maxAge: 35 },
    { name: 'Senior', gender: 'D' as const, minAge: 21, maxAge: 35 },
    { name: 'Veteran', gender: 'H' as const, minAge: 36, maxAge: null },
    { name: 'Veteran', gender: 'D' as const, minAge: 36, maxAge: null },
  ];

  await prisma.categoryConfig.deleteMany({ where: { clubId: club.id } });
  await prisma.categoryConfig.createMany({
    data: defaultCategories.map((cat, index) => ({
      clubId: club.id,
      name: cat.name,
      gender: cat.gender,
      minAge: cat.minAge,
      maxAge: cat.maxAge,
      displayOrder: index + 1,
    })),
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@bcanalamanga.mg' },
    update: {},
    create: {
      name: 'Admin Club',
      email: 'admin@bcanalamanga.mg',
      passwordHash,
      role: 'adminClub',
      clubId: club.id,
    },
  });

  const players = [
    {
      firstName: 'Hery',
      lastName: 'Rakoto',
      birthDate: new Date('2008-03-15'),
      gender: 'G' as const,
    },
    {
      firstName: 'Naina',
      lastName: 'Andria',
      birthDate: new Date('2006-07-22'),
      gender: 'F' as const,
    },
    {
      firstName: 'Tiana',
      lastName: 'Rabe',
      birthDate: new Date('1995-11-01'),
      gender: 'H' as const,
    },
    {
      firstName: 'Soa',
      lastName: 'Razafy',
      birthDate: new Date('2010-05-10'),
      gender: 'F' as const,
    },
    {
      firstName: 'Mamy',
      lastName: 'Randria',
      birthDate: new Date('2003-09-30'),
      gender: 'G' as const,
    },
  ];

  for (const player of players) {
    await prisma.player.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${players.indexOf(player) + 3}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000000${players.indexOf(player) + 3}`,
        clubId: club.id,
        firstName: player.firstName,
        lastName: player.lastName,
        birthDate: player.birthDate,
        gender: player.gender,
        address: 'Antananarivo, Madagascar',
      },
    });
  }

  console.log('Seed completed:', {
    season: season.label,
    club: club.name,
    players: players.length,
    categories: defaultCategories.length,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
