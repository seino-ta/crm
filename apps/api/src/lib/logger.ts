import pino, { type LoggerOptions } from 'pino';

import env from '../config/env';

const options: LoggerOptions = {
  level: env.logLevel,
  ...(env.nodeEnv === 'development'
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

const logger = pino(options);

export default logger;
