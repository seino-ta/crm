import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

import { ensureRuntimeConfig, type RuntimeConfig } from './runtime';

function loadEnvFiles(): void {
  const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  const searchPaths = [
    path.resolve(__dirname, '../../../../', envFile),
    path.resolve(process.cwd(), envFile),
  ];

  for (const filePath of searchPaths) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath });
    }
  }
}

export function buildNodeRuntimeConfig(): RuntimeConfig {
  loadEnvFiles();

  const nodeEnv = (process.env.NODE_ENV as RuntimeConfig['nodeEnv']) || 'development';
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required but not set.');
  }

  return {
    nodeEnv,
    port: Number(process.env.PORT || 4000),
    logLevel: process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    security: {
      bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
      rateLimit: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
        max: Number(process.env.RATE_LIMIT_MAX || 100),
      },
    },
  };
}

export function initNodeRuntimeConfig(): RuntimeConfig {
  const config = buildNodeRuntimeConfig();
  ensureRuntimeConfig(config);
  return config;
}
