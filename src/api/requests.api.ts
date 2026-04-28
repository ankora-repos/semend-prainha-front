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
};
