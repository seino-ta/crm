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

// prisma CLI の場所を探索（ワークスペースのルートに hoist されるケースを考慮）
const prismaCandidates = [
  path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
  path.resolve(process.cwd(), '../../node_modules/.bin/prisma'),
];
const prismaBin = prismaCandidates.find((p) => fs.existsSync(p));
if (!prismaBin) {
  throw new Error('Prisma CLI (prisma) が見つかりません。npm install が完了しているか確認してください。');
}
const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

export default async function globalSetup(): Promise<void> {
  // 一旦テストDBをリセット（データ残りによるログイン失敗を防ぐ）
  run(`yes | ${prismaBin} migrate reset --force --skip-generate --skip-seed --schema ${schemaPath}`);
  // migrate
  run(`${prismaBin} migrate deploy --schema ${schemaPath}`);

  // seed は ts-node 経由で直接実行（prisma db seed の設定差異による取りこぼし防止）
  const tsNodeCandidates = [
    path.resolve(process.cwd(), 'node_modules/.bin/ts-node'),
    path.resolve(process.cwd(), '../../node_modules/.bin/ts-node'),
  ];
  const tsNodeBin = tsNodeCandidates.find((p) => fs.existsSync(p));
  if (!tsNodeBin) {
    throw new Error('ts-node が見つかりません。npm install が完了しているか確認してください。');
  }
  const seedScript = path.resolve(process.cwd(), 'prisma/seed.ts');
  run(`${tsNodeBin} --project tsconfig.prisma.json ${seedScript}`);
}
