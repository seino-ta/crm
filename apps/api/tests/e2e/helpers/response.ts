import type { Response } from 'supertest';

import type { ApiError, ApiSuccess } from '../../../src/utils/response';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccess<T>(body: unknown): body is ApiSuccess<T> {
  return (
    isRecord(body) &&
    body.success === true &&
    'data' in body
  );
}

export function expectApiSuccess<T>(res: Response): ApiSuccess<T> {
  const body = res.body as unknown;
  if (isApiSuccess<T>(body)) {
    return body;
  }
  throw new Error(`Expected ApiSuccess response but received: ${res.status} ${JSON.stringify(body)}`);
}

export function expectApiSuccessData<T>(res: Response): T {
  return expectApiSuccess<T>(res).data;
}

export function expectApiError(res: Response): ApiError {
  const body = res.body as unknown;
  if (isRecord(body) && body.success === false && 'error' in body) {
    return body as ApiError;
  }
  throw new Error(`Expected ApiError response but received: ${res.status} ${JSON.stringify(body)}`);
}
