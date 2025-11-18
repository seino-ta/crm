import path from 'path';

import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

type NodeEnv = 'development' | 'test' | 'production';

const nodeEnv = (process.env.NODE_ENV as NodeEnv) || 'development';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required but not set.');
}

const config = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  },
};

export default config;
