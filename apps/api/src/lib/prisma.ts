import { createRequire } from 'node:module';

import { PrismaD1 } from '@prisma/adapter-d1';
import type { Prisma, PrismaClient as NodePrismaClient } from '@prisma/client';
import type { PrismaClient as EdgePrismaClient } from '@prisma/client/edge';
import { PrismaClient as EdgeClient } from '@prisma/client/edge';


import { getRuntimeConfig } from '../config/runtime';
import type { AppBindings } from '../types/runtime';

const isNodeRuntime = typeof process !== 'undefined' && !!process.versions?.node;

type PrismaClientInstance = NodePrismaClient | EdgePrismaClient;

let client: PrismaClientInstance | null = null;
let edgeBindings: AppBindings | null = null;
let cachedNodeRequire: NodeRequire | null = null;

type NodePrismaClientModule = { PrismaClient: new (...args: unknown[]) => NodePrismaClient };

function getNodeRequire(): NodeRequire {
  if (cachedNodeRequire) {
    return cachedNodeRequire;
  }

  const moduleIdentifier = typeof __filename === 'string'
    ? __filename
    : (typeof process !== 'undefined' && typeof process.cwd === 'function'
        ? `${process.cwd()}/__virtual.js`
        : '/__virtual.js');

  cachedNodeRequire = createRequire(moduleIdentifier);
  return cachedNodeRequire;
}

function createNodeClient(): NodePrismaClient {
  const { PrismaClient } = getNodeRequire()('@prisma/client') as NodePrismaClientModule;
  const config = getRuntimeConfig();
  const logLevels: Prisma.LogLevel[] = config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'];
  return new PrismaClient({ log: logLevels });
}

function createEdgeClient(bindings: AppBindings): EdgePrismaClient {
  const adapter = new PrismaD1(bindings.DB);
  return new EdgeClient({ adapter });
}

export function bindEdgeBindings(bindings: AppBindings): void {
  edgeBindings = bindings;
}

function ensureClient(): PrismaClientInstance {
  if (client) {
    return client;
  }

  if (isNodeRuntime) {
    client = createNodeClient();
    return client;
  }

  if (!edgeBindings) {
    throw new Error('Edge bindings are not initialized for Prisma client');
  }

  client = createEdgeClient(edgeBindings);
  return client;
}

const prisma = new Proxy<PrismaClientInstance>({} as PrismaClientInstance, {
  get(_target, prop, receiver) {
    const instance = ensureClient();
    const value = Reflect.get(instance as object, prop, receiver) as PrismaClientInstance[keyof PrismaClientInstance];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

export default prisma;
