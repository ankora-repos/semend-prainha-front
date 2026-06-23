import { api } from './client';
import type {
  ProtocolRequest,
  CreateRequestDto,
  ListRequestsParams,
  PaginatedResponse,
} from '@/types/request.types';

export const requestsApi = {
  async create(data: CreateRequestDto): Promise<ProtocolRequest> {
    const res = await api.post<ProtocolRequest>('/requests', data);
    return res.data;
  },

  async list(params?: ListRequestsParams): Promise<PaginatedResponse<ProtocolRequest>> {
    const res = await api.get<PaginatedResponse<ProtocolRequest>>('/requests', { params });
    return res.data;
  },

  async getById(id: string): Promise<ProtocolRequest> {
    const res = await api.get<ProtocolRequest>(`/requests/${id}`);
    return res.data;
  },

  async getTimeline(id: string) {
    const res = await api.get(`/requests/${id}/timeline`);
    return res.data;
  },

  /** Soft-delete de um protocolo (somente admin), com justificativa obrigatória. */
  async remove(id: string, reason: string): Promise<{ message: string; protocolNumber: string }> {
    const res = await api.delete(`/requests/${id}`, { data: { reason } });
    return res.data;
  },

  /** Lista de protocolos apagados (somente admin) — read-only. */
  async listDeleted(): Promise<DeletedRequest[]> {
    const res = await api.get<DeletedRequest[]>('/requests/deleted');
    return res.data;
  },

  /** Detalhe travado de um protocolo apagado (somente admin). */
  async getDeleted(id: string): Promise<ProtocolRequest> {
    const res = await api.get<ProtocolRequest>(`/requests/deleted/${id}`);
    return res.data;
  },

  /** Troca o tipo de solicitação de um protocolo (somente admin), com justificativa. */
  async changeRequestType(id: string, requestTypeId: string, justification: string) {
    const res = await api.patch(`/requests/${id}/request-type`, { requestTypeId, justification });
    return res.data;
  },
};

export interface DeletedRequest {
  id: string;
  protocolNumber: string;
  description: string;
  status: string;
  requestType: string | null;
  currentSector: string | null;
  requesterName: string | null;
  createdAt: string;
  deletedAt: string;
  deletionReason: string | null;
  deletedByName: string | null;
}
