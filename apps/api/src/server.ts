import { serve } from '@hono/node-server';

import app from './app';
import { initNodeRuntimeConfig } from './config/node';
import logger from './lib/logger';

const config = initNodeRuntimeConfig();

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    logger.info({ port: info.port, env: config.nodeEnv }, 'Server started');
  }
);

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Gracefully shutting down');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
