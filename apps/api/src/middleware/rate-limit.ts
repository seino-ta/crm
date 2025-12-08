import type { NextFunction, Request, Response } from 'express';

import config from '../config/env';

type Counter = { count: number; resetAt: number };

const windowMs = config.security.rateLimit.windowMs;
const limit = config.security.rateLimit.max;
const buckets = new Map<string, Counter>();

function getBucket(key: string): Counter {
  const now = Date.now();
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }
  const bucket = { count: 0, resetAt: now + windowMs };
  buckets.set(key, bucket);
  return bucket;
}

const skipPaths = ['/api/health', '/api/auth/me'];

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (skipPaths.includes(req.path)) {
    next();
    return;
  }

  const key = req.ip || 'unknown';
  const bucket = getBucket(key);
  bucket.count += 1;

  if (bucket.count > limit) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfterMs: Math.max(0, bucket.resetAt - Date.now()),
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(bucket.resetAt));

  next();
}

// Optional: periodic cleanup to avoid unbounded map growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, windowMs).unref();
