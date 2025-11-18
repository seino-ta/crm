import path from 'path';

import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

type NodeEnv = 'development' | 'test' | 'production';

const nodeEnv = (process.env.NODE_ENV as NodeEnv) || 'development';

const config = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
  databaseUrl: process.env.DATABASE_URL || '',
};

export default config;
