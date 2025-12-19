import type { D1Database } from '@cloudflare/workers-types';
import type { UserRole } from '@prisma/client';
import type { Context, Hono } from 'hono';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AppBindings = {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  BCRYPT_SALT_ROUNDS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX?: string;
  LOG_LEVEL?: string;
  NODE_ENV?: string;
};

export type AppVariables = {
  user?: AuthenticatedUser;
  validatedBody?: unknown;
};

export type AppEnv = { Bindings: AppBindings; Variables: AppVariables };

export type AppContext = Context<AppEnv>;

export type AppHono = Hono<AppEnv>;
