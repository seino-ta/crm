export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

export type UserRole = 'ADMIN' | 'MANAGER' | 'REP';

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  title?: string | null;
  role: UserRole;
};

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'ARCHIVED';

export type Account = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  size: number | null;
  description: string | null;
  annualRevenue: string | null;
  phone: string | null;
  status: AccountStatus;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  account?: Account;
};

export type PipelineStage = {
  id: string;
  name: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  description: string | null;
};

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST' | 'ARCHIVED';

export type Opportunity = {
  id: string;
  name: string;
  accountId: string;
  ownerId: string;
  stageId: string;
  contactId?: string | null;
  amount?: string | null;
  currency: string;
  probability?: number | null;
  status: OpportunityStatus;
  expectedCloseDate?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  owner?: User;
  stage?: PipelineStage;
  contact?: Contact | null;
};

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'OTHER';

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  userId: string;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  occurredAt: string;
  user?: User;
  account?: Account | null;
  contact?: Contact | null;
  opportunity?: Opportunity | null;
};

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  ownerId: string;
  accountId?: string | null;
  opportunityId?: string | null;
  createdAt: string;
  owner?: User;
  account?: Account | null;
  opportunity?: Opportunity | null;
};

export type StageReportRow = {
  stageId: string;
  _sum: { amount: string | null };
  _count: { _all: number };
};

export type OwnerReportRow = {
  ownerId: string;
  _sum: { amount: string | null };
  _count: { _all: number };
};

export type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | null;
  userId: string;
  opportunityId?: string | null;
  createdAt: string;
  user?: User | null;
  opportunity?: Opportunity | null;
};
