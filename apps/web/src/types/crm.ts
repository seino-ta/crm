// ローカルビルドで Prisma 依存を持ち込まないため、API 側の enum を手動で同期する。
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'OTHER';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'STAGE_CHANGE';
