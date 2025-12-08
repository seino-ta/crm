import type { NextFunction, Request, Response } from 'express';

type Counter = { count: number; resetAt: number };

const windowMs = 60 * 1000; // 1 minute
const limit = 100; // recommended starter limit per IP per minute
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

export function rateLimit(req: Request, res: Response, next: NextFunction) {
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
