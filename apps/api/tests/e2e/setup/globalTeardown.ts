import { PrismaClient } from '@prisma/client';

export default async function globalTeardown(): Promise<void> {
  // 最終的な後処理は不要だが、開いたコネクションを確実に閉じる
  const prisma = new PrismaClient();
  await prisma.$disconnect();
}
