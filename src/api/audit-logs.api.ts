import { api } from './client';
import type { AuditLog, AuditLogListParams } from '@/types/audit.types';
import type { PaginatedResponse } from '@/types/request.types';

export const auditLogsApi = {
  async list(params?: AuditLogListParams): Promise<PaginatedResponse<AuditLog>> {
    const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
    return res.data;
  },

  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>(`/audit-logs/${entityType}/${entityId}`);
    return res.data;
  },

  async getProtocolActivity(requestId: string): Promise<ProtocolActivity[]> {
    const res = await api.get<ProtocolActivity[]>(`/audit-logs/protocol/${requestId}`);
    return res.data;
  },
};

export interface ProtocolActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
  actorName: string;
  payloadBefore?: Record<string, unknown> | null;
  payloadAfter?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
