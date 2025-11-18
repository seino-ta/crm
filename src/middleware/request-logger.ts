import pinoHttp from 'pino-http';

import env from '../config/env';
import logger from '../lib/logger';

const requestLogger = pinoHttp({
  logger,
  autoLogging: env.nodeEnv !== 'test',
  redact: ['req.headers.authorization', 'req.body.password'],
});

export default requestLogger;
