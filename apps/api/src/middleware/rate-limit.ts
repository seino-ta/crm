import type { MiddlewareHandler } from 'hono';

import { getRuntimeConfig } from '../config/runtime';
import type { AppBindings, AppVariables } from '../types/runtime';

const buckets = new Map<string, { count: number; resetAt: number }>();
const skipPaths = ['/api/healthz', '/api/readyz', '/api/auth/me'];

function cleanupBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getBucket(windowMs: number, key: string) {
  const now = Date.now();
  cleanupBuckets(now);
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }
  const bucket = { count: 0, resetAt: now + windowMs };
  buckets.set(key, bucket);
  return bucket;
}

export const rateLimit: MiddlewareHandler<{ Bindings: AppBindings; Variables: AppVariables }> = async (c, next) => {
  const path = c.req.path;
  if (skipPaths.includes(path)) {
    await next();
    return;
  }

  const config = getRuntimeConfig();
  const key = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const bucket = getBucket(config.security.rateLimit.windowMs, key);
  bucket.count += 1;

  if (bucket.count > config.security.rateLimit.max) {
    return c.json({
      success: false,
      error: {
        message: 'Too many requests',
        details: { retryAfterMs: Math.max(0, bucket.resetAt - Date.now()) },
      },
    }, 429);
  }

  c.res.headers.set('X-RateLimit-Limit', String(config.security.rateLimit.max));
  c.res.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.security.rateLimit.max - bucket.count)));
  c.res.headers.set('X-RateLimit-Reset', String(bucket.resetAt));

  await next();
};
