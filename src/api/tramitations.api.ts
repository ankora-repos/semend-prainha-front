import { api } from './client';
import type { ForwardDto, ChangeStatusDto } from '@/types/request.types';

export const tramitationsApi = {
  async forward(requestId: string, data: ForwardDto) {
    const res = await api.post(`/requests/${requestId}/forward`, data);
    return res.data;
  },

  async receive(requestId: string) {
    const res = await api.post(`/requests/${requestId}/receive`);
    return res.data;
  },

  async changeStatus(requestId: string, data: ChangeStatusDto) {
    const res = await api.patch(`/requests/${requestId}/status`, data);
    return res.data;
  },
};
