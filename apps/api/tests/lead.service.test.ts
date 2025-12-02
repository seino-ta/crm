import { AuditAction, LeadStatus, UserRole } from '@prisma/client';
import createError from 'http-errors';

import * as leadService from '../src/modules/lead/lead.service';

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

const prisma = jest.requireMock('../src/lib/prisma').default as any;

const actorOwner = { id: 'user-1', email: 'u1@example.com', role: UserRole.REP };
const actorManager = { id: 'user-2', email: 'u2@example.com', role: UserRole.MANAGER };
const actorOther = { id: 'user-3', email: 'u3@example.com', role: UserRole.REP };

describe('lead.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('ownerまたは管理ロールが作成できる', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: actorOwner.id } as any);
      prisma.account.findFirst.mockResolvedValue({ id: 'acc-1' } as any);
      prisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        status: LeadStatus.NEW,
        ownerId: actorOwner.id,
      } as any);

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

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Lead A',
            owner: { connect: { id: actorOwner.id } },
          }),
        })
      );
      expect(lead.id).toBe('lead-1');
    });

    it('オーナー以外のREPは403になる', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: actorOwner.id } as any);
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
      } as any);

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
      } as any);
      prisma.user.findUnique.mockResolvedValue({ id: actorOther.id } as any);
      prisma.lead.update.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOther.id,
        status: LeadStatus.QUALIFIED,
      } as any);

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
      } as any);
      prisma.lead.update.mockResolvedValue({ id: 'lead-1' } as any);

      await expect(leadService.softDeleteLead('lead-1', actorOwner)).resolves.not.toThrow();
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('オーナーでないREPは削除できず403', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        ownerId: actorOwner.id,
        status: LeadStatus.NEW,
      } as any);

      await expect(leadService.softDeleteLead('lead-1', actorOther)).rejects.toMatchObject({ status: 403 });
    });
  });
});
