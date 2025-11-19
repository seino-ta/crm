import app from './app';
import env from './config/env';
import logger from './lib/logger';

function startServer(): void {
  const server = app.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Server started');
  });

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
}

startServer();
