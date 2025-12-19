import type { UserRole } from '@prisma/client';
import { sign, verify, type Secret, type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

import { getRuntimeConfig } from '../config/runtime';

export type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signAccessToken(user: { id: string; email: string; role: UserRole }): string {
  const env = getRuntimeConfig();
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const expiresIn = env.jwt.expiresIn as StringValue;
  const options: SignOptions = { expiresIn };

  return sign(payload, env.jwt.secret as Secret, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  const env = getRuntimeConfig();
  return verify(token, env.jwt.secret as Secret) as TokenPayload;
}
