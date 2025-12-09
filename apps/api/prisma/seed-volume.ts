import crypto from 'node:crypto';

import { PrismaClient, UserRole, LeadStatus, AccountStatus } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const TARGET_COUNT = 30; // 25 以上を保証するため少し多めに作成
const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || 'ChangeMe123!';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

async function getOrCreateAccountId(): Promise<string> {
  const existing = await prisma.account.findFirst();
  if (existing) return existing.id;

  const created = await prisma.account.create({
    data: {
      name: 'Sample Account',
      industry: 'General',
      status: AccountStatus.ACTIVE,
      description: 'Auto-generated for bulk seed.',
    },
  });
  return created.id;
}

async function getOwnerUser(): Promise<{ id: string; email: string }> {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) return { id: existing.id, email: existing.email };

  const created = await prisma.user.create({
    data: {
      email: 'owner@example.test',
      passwordHash: hashSync(DEFAULT_PASSWORD, SALT_ROUNDS),
      firstName: 'Owner',
      lastName: 'User',
      role: UserRole.MANAGER,
    },
  });
  return { id: created.id, email: created.email };
}

async function ensureContacts(accountId: string) {
  const current = await prisma.contact.count();
  if (current >= TARGET_COUNT) {
    console.log(`Contacts: 既に ${current} 件あるため追加なし`);
    return;
  }
  const need = TARGET_COUNT - current;
  const data = Array.from({ length: need }).map((_, idx) => {
    const n = current + idx + 1;
    return {
      id: crypto.randomUUID(),
      accountId,
      firstName: `Contact${n}`,
      lastName: 'Sample',
      email: `contact${n}@example.test`,
      phone: `+1-555-01${String(n).padStart(2, '0')}`,
      jobTitle: 'Auto-seeded',
    };
  });
  await prisma.contact.createMany({ data, skipDuplicates: true });
  console.log(`Contacts: ${need} 件追加 (合計 ${current + need} 件想定)`);
}

async function ensureLeads(ownerId: string, accountId: string) {
  const current = await prisma.lead.count();
  if (current >= TARGET_COUNT) {
    console.log(`Leads: 既に ${current} 件あるため追加なし`);
    return;
  }
  const need = TARGET_COUNT - current;
  const statuses: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.LOST, LeadStatus.CONVERTED];

  const data = Array.from({ length: need }).map((_, idx) => {
    const n = current + idx + 1;
    const status = statuses[(n - 1) % statuses.length] as LeadStatus;
    return {
      id: crypto.randomUUID(),
      name: `Lead ${n}`,
      company: `Example Corp ${n}`,
      email: `lead${n}@example.test`,
      phone: `+1-444-02${String(n).padStart(2, '0')}`,
      status,
      ownerId,
      accountId: n % 2 === 0 ? accountId : null,
      notes: 'Auto-seeded sample lead',
    };
  });

  await prisma.lead.createMany({ data, skipDuplicates: true });
  console.log(`Leads: ${need} 件追加 (合計 ${current + need} 件想定)`);
}

async function ensureUsers() {
  const current = await prisma.user.count();
  if (current >= TARGET_COUNT) {
    console.log(`Users: 既に ${current} 件あるため追加なし`);
    return;
  }
  const need = TARGET_COUNT - current;
  const passwordHash = hashSync(DEFAULT_PASSWORD, SALT_ROUNDS);
  const roles: UserRole[] = [UserRole.REP, UserRole.MANAGER, UserRole.REP];

  const data = Array.from({ length: need }).map((_, idx) => {
    const n = current + idx + 1;
    const role = roles[(n - 1) % roles.length] as UserRole;
    return {
      id: crypto.randomUUID(),
      email: `user${n}@crm.local`,
      passwordHash,
      firstName: 'Sample',
      lastName: `User${n}`,
      role,
      title: 'Auto-seeded',
      isActive: true,
    };
  });

  await prisma.user.createMany({ data, skipDuplicates: true });
  console.log(`Users: ${need} 件追加 (合計 ${current + need} 件想定)`);
}

async function main() {
  const accountId = await getOrCreateAccountId();
  const owner = await getOwnerUser();

  await ensureContacts(accountId);
  await ensureLeads(owner.id, accountId);
  await ensureUsers();
}

main()
  .catch((error) => {
    console.error('❌ volume seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
