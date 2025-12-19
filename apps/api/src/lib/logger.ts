import pino, { type LoggerOptions } from 'pino';

import { getRuntimeConfig } from '../config/runtime';

function buildOptions(): LoggerOptions {
  let level = 'info';
  let isDev = false;
  try {
    const config = getRuntimeConfig();
    level = config.logLevel;
    isDev = config.nodeEnv === 'development';
  } catch {
    // runtime config not initialized yet (tests or build). Keep defaults.
  }

  return {
    level,
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
            },
          },
        }
      : {}),
  };
}

const logger = pino(buildOptions());

export default logger;
