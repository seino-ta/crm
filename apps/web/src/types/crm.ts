export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'OTHER';
export const ACTIVITY_TYPES: ActivityType[] = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'OTHER'];

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'STAGE_CHANGE';
