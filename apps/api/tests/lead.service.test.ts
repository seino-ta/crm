import { LeadStatus, UserRole } from '@prisma/client';

import * as leadService from '../src/modules/lead/lead.service';

type MockFn<TResult> = jest.Mock<Promise<TResult>, [unknown?]>;
type LeadRecord = {
  id: string;
  ownerId: string;
  status: LeadStatus;
};
type PrismaMock = {
  user: { findUnique: MockFn<{ id: string } | null> };
  account: { findFirst: MockFn<{ id: string } | null> };
  lead: {
    findMany: MockFn<LeadRecord[]>;
    count: MockFn<number>;
    findFirst: MockFn<LeadRecord | null>;
    create: MockFn<LeadRecord>;
    update: MockFn<LeadRecord>;
  };
};

// prisma と監査ログはモックする
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    account: { findFirst: jest.fn() },
    lead: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/modules/audit-log/audit-log.helper', () => ({
  createAuditLogEntry: jest.fn(),
}));

const prismaModule: { default: PrismaMock } = jest.requireMock('../src/lib/prisma');
const prisma = prismaModule.default;

const actorOwner = { id: 'user-1', email: 'u1@example.com', role: UserRole.REP };
const actorManager = { id: 'user-2', email: 'u2@example.com', role: UserRole.MANAGER };
const actorOther = { id: 'user-3', email: 'u3@example.com', role: UserRole.REP };

describe('lead.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('ownerまたは管理ロールが作成できる', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: actorOwner.id });
      prisma.account.findFirst.mockResolvedValue({ id: 'acc-1' });
      prisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        status: LeadStatus.NEW,
        ownerId: actorOwner.id,
      });

      const lead = await leadService.createLead(
        {
          name: 'Lead A',
          ownerId: actorOwner.id,
          accountId: 'acc-1',
          company: undefined,
          email: undefined,
          phone: undefined,
          source: undefined,
          notes: undefined,
          status: undefined,
        },
        actorOwner
      );

      expect(lead.id).toBe('lead-1');
    });

    it('オーナー以外のREPは403になる', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: actorOwner.id });
      await expect(
        leadService.createLead(
          {
            name: 'Lead B',
            ownerId: actorOwner.id,
            company: undefined,
            email: undefined,
            phone: undefined,
            source: undefined,
            notes: undefined,
            accountId: undefined,
            status: undefined,
          },
          actorOther
        )
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('updateLead', () => {
    it('オーナー以外のREPがownerを変更しようとすると403', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      });

      await expect(
        leadService.updateLead(
          'lead-1',
          { ownerId: actorOther.id },
          actorOther
        )
      ).rejects.toMatchObject({ status: 403 });
    });

    it('MANAGERは別オーナーのリードも更新できる', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      });
      prisma.user.findUnique.mockResolvedValue({ id: actorOther.id });
      prisma.lead.update.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOther.id,
        status: LeadStatus.QUALIFIED,
      });

      const result = await leadService.updateLead(
        'lead-1',
        { ownerId: actorOther.id, status: LeadStatus.QUALIFIED },
        actorManager
      );

      expect(result.status).toBe(LeadStatus.QUALIFIED);
      expect(prisma.lead.update).toHaveBeenCalled();
    });
  });

  describe('softDeleteLead', () => {
    it('オーナー自身は削除できる', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      });
      prisma.lead.update.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      });

      await expect(leadService.softDeleteLead('lead-1', actorOwner)).resolves.not.toThrow();
      expect(prisma.lead.update).toHaveBeenCalled();
      const updateArgs = prisma.lead.update.mock.calls[0]?.[0] as { where?: { id?: string }; data?: { deletedAt?: unknown } } | undefined;
      expect(updateArgs?.where?.id).toBe('lead-1');
      expect(updateArgs?.data?.deletedAt).toBeInstanceOf(Date);
    });

    it('オーナーでないREPは削除できず403', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      });

      await expect(leadService.softDeleteLead('lead-1', actorOther)).rejects.toMatchObject({ status: 403 });
    });
  });
});
