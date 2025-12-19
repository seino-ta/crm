import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';
import type { HttpError } from 'http-errors';

import { getRuntimeConfig } from '../config/runtime';
import logger from '../lib/logger';
import type { AppContext } from '../types/runtime';
import { errorResponse } from '../utils/response';

export function handleError(err: unknown, c: AppContext) {
  const error = err as HttpError;
  const status = toContentfulStatusCode(error?.status);
  const config = getRuntimeConfig();
  const isProd = config.nodeEnv === 'production';

  logger.error({ err: error, status }, 'Unhandled error');

  return c.json(errorResponse(error?.message || 'Internal Server Error', error?.name, isProd ? undefined : error?.stack), status);
}

function toContentfulStatusCode(code?: number): ContentfulStatusCode {
  if (!isStatusCode(code)) {
    return 500;
  }
  if (code < 200 || code === 204 || code === 205 || code === 304) {
    return 500;
  }
  return code as ContentfulStatusCode;
}

function isStatusCode(code?: number): code is StatusCode {
  return typeof code === 'number' && code >= 100 && code <= 599;
}
