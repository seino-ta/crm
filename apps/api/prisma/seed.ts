import { Prisma, PrismaClient, UserRole, OpportunityStatus, TaskPriority, TaskStatus, ActivityType, AccountStatus, AccountAssignmentRole, AuditAction } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  manager: '00000000-0000-0000-0000-000000000002',
  account: '00000000-0000-0000-0000-000000000101',
  contact: '00000000-0000-0000-0000-000000000201',
  opportunity: '00000000-0000-0000-0000-000000000301',
  activity: '00000000-0000-0000-0000-000000000401',
  task: '00000000-0000-0000-0000-000000000501',
  auditLog: '00000000-0000-0000-0000-000000000601',
  assignment: '00000000-0000-0000-0000-000000000701',
};

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || 'ChangeMe123!';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

async function seedPipelineStages() {
  const stageData = [
    { name: 'Prospecting', order: 10, probability: 10 },
    { name: 'Qualified', order: 20, probability: 25 },
    { name: 'Proposal', order: 30, probability: 50 },
    { name: 'Negotiation', order: 40, probability: 75 },
    { name: 'Closed Won', order: 50, probability: 100, isWon: true },
    { name: 'Closed Lost', order: 60, probability: 0, isLost: true },
  ];

  await prisma.pipelineStage.createMany({ data: stageData, skipDuplicates: true });
}

async function main() {
  await seedPipelineStages();

  const admin = await prisma.user.upsert({
    where: { id: IDS.admin },
    update: {},
    create: {
      id: IDS.admin,
      email: 'admin@crm.local',
      passwordHash: hashSync(DEFAULT_PASSWORD, SALT_ROUNDS),
      firstName: 'Aiko',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { id: IDS.manager },
    update: {},
    create: {
      id: IDS.manager,
      email: 'manager@crm.local',
      passwordHash: hashSync(DEFAULT_PASSWORD, SALT_ROUNDS),
      firstName: 'Makoto',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  });

  const account = await prisma.account.upsert({
    where: { id: IDS.account },
    update: {
      description: 'Key enterprise customer focused on manufacturing automation.',
    },
    create: {
      id: IDS.account,
      name: 'Acme Industries',
      domain: 'acme-industries.example',
      industry: 'Manufacturing',
      website: 'https://acme-industries.example',
      size: 1200,
      annualRevenue: new Prisma.Decimal(12500000),
      phone: '+1-202-555-0101',
      status: AccountStatus.ACTIVE,
      description: 'Key enterprise customer focused on manufacturing automation.',
    },
  });

  await prisma.accountAssignment.upsert({
    where: { id: IDS.assignment },
    update: {},
    create: {
      id: IDS.assignment,
      accountId: account.id,
      userId: manager.id,
      role: AccountAssignmentRole.OWNER,
    },
  });

  const contact = await prisma.contact.upsert({
    where: { id: IDS.contact },
    update: {},
    create: {
      id: IDS.contact,
      accountId: account.id,
      firstName: 'Kana',
      lastName: 'Client',
      email: 'kana.client@acme-industries.example',
      phone: '+1-415-555-0099',
      jobTitle: 'VP of Operations',
      notes: 'Prefers bi-weekly status emails.',
    },
  });

  const qualifiedStage = await prisma.pipelineStage.findUnique({ where: { name: 'Qualified' } });
  if (!qualifiedStage) {
    throw new Error('Qualified stage must exist before creating opportunities.');
  }

  const opportunity = await prisma.opportunity.upsert({
    where: { id: IDS.opportunity },
    update: {
      description: 'Upgraded automation rollout for FY2026.',
    },
    create: {
      id: IDS.opportunity,
      name: 'Automation Rollout FY26',
      accountId: account.id,
      ownerId: manager.id,
      stageId: qualifiedStage.id,
      contactId: contact.id,
      amount: new Prisma.Decimal(480000),
      currency: 'USD',
      probability: 35,
      status: OpportunityStatus.OPEN,
      expectedCloseDate: new Date(new Date().getFullYear(), 8, 30),
      description: 'Upgraded automation rollout for FY2026.',
    },
  });

  const activity = await prisma.activity.upsert({
    where: { id: IDS.activity },
    update: {},
    create: {
      id: IDS.activity,
      type: ActivityType.MEETING,
      subject: 'Kickoff discovery call',
      description: 'Discussed requirements and success metrics.',
      userId: manager.id,
      accountId: account.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
      occurredAt: new Date(),
    },
  });

  await prisma.task.upsert({
    where: { id: IDS.task },
    update: {},
    create: {
      id: IDS.task,
      title: 'Send proposal deck',
      description: 'Follow up with tailored ROI slides.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      ownerId: manager.id,
      activityId: activity.id,
      accountId: account.id,
      opportunityId: opportunity.id,
      contactId: contact.id,
    },
  });

  await prisma.auditLog.upsert({
    where: { id: IDS.auditLog },
    update: {},
    create: {
      id: IDS.auditLog,
      entityType: 'Opportunity',
      entityId: opportunity.id,
      action: AuditAction.CREATE,
      userId: admin.id,
      opportunityId: opportunity.id,
      changes: {
        message: 'Seeded opportunity created.',
      },
    },
  });

  console.log('✅ Prisma seed data created.');
  console.log('   Sample credentials -> email: admin@crm.local / manager@crm.local, password:', DEFAULT_PASSWORD);
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
