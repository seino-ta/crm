import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resetDatabase(): Promise<void> {
  // public スキーマのユーザーテーブルをまとめて TRUNCATE (migrations を除く)
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
  `;

  if (!tables.length) return;

  const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
