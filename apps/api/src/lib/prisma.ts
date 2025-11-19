import { type Prisma, PrismaClient } from '@prisma/client';

import env from '../config/env';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const logLevels: Prisma.LogLevel[] = env.nodeEnv === 'development'
  ? ['query', 'info', 'warn', 'error']
  : ['warn', 'error'];

const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
