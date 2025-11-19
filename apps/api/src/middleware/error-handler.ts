import type { NextFunction, Request, Response } from 'express';
import type { HttpError } from 'http-errors';

import logger from '../lib/logger';
import { errorResponse } from '../utils/response';

const errorHandler = (err: HttpError, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  logger.error({ err, status }, 'Unhandled error');

  const payload = errorResponse(
    err.message || 'Internal Server Error',
    err.name,
    isProd ? undefined : err.stack
  );

  res.status(status).json(payload);
};

export default errorHandler;
