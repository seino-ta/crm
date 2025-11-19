export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(message: string, code?: string, details?: unknown): ApiError {
  return {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
  };
}
