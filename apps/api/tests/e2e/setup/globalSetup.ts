import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

// .env.test を優先ロード
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST is required for e2e tests');
}

// Prisma CLI が参照するように DATABASE_URL を上書き
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
const tsNodeCandidates = [
  path.resolve(process.cwd(), 'node_modules/.bin/ts-node'),
  path.resolve(process.cwd(), '../../node_modules/.bin/ts-node'),
];
const tsNodeBin = tsNodeCandidates.find((p) => fs.existsSync(p));
if (!tsNodeBin) {
  throw new Error('ts-node が見つかりません。npm install が完了しているか確認してください。');
}
const seedScript = path.resolve(process.cwd(), 'prisma/seed.ts');

export default function globalSetup(): void {
  const dbPath = resolveSqlitePath(process.env.DATABASE_URL_TEST!);
  prepareDatabaseFile(dbPath);
  applySqliteMigrations(dbPath);
  run(`${tsNodeBin} --project tsconfig.prisma.json ${seedScript}`);
}

function resolveSqlitePath(url: string): string {
  if (!url.startsWith('file:')) {
    throw new Error('DATABASE_URL_TEST must be a sqlite file URL');
  }
  const [rawPath] = url.slice('file:'.length).split('?');
  if (!rawPath) {
    throw new Error('SQLite DATABASE_URL must include a file path');
  }
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
}

function prepareDatabaseFile(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath);
  }
}

function applySqliteMigrations(dbPath: string) {
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (dirs.length === 0) {
    throw new Error('No migrations found under prisma/migrations.');
  }

  for (const dir of dirs) {
    const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
    if (!fs.existsSync(sqlFile)) {
      continue;
    }
    execSync(`sqlite3 "${dbPath}" < "${sqlFile}"`, { stdio: 'inherit' });
  }
}

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}
