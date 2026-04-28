export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
  actorName?: string;
  payloadBefore: Record<string, unknown> | null;
  payloadAfter: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogListParams {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
