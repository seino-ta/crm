import type { AppBindings } from '../types/runtime';

import { ensureRuntimeConfig, type RuntimeConfig } from './runtime';

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function buildRuntimeConfigFromBindings(env: AppBindings): RuntimeConfig {
  const nodeEnv = (env.NODE_ENV as RuntimeConfig['nodeEnv']) || 'production';
  const secret = env.JWT_SECRET;

  if (!secret) {
    throw new Error('Cloudflare binding JWT_SECRET is mandatory.');
  }

  return {
    nodeEnv,
    port: 8787,
    logLevel: env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
    jwt: {
      secret,
      expiresIn: env.JWT_EXPIRES_IN || '1d',
    },
    security: {
      bcryptSaltRounds: toNumber(env.BCRYPT_SALT_ROUNDS, 12),
      rateLimit: {
        windowMs: toNumber(env.RATE_LIMIT_WINDOW_MS, 60_000),
        max: toNumber(env.RATE_LIMIT_MAX, 100),
      },
    },
  };
}

export function ensureRuntimeConfigFromBindings(env: AppBindings): RuntimeConfig {
  try {
    return ensureRuntimeConfig();
  } catch {
    const config = buildRuntimeConfigFromBindings(env);
    return ensureRuntimeConfig(config);
  }
}
