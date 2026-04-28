import { api } from './client';
import type { RequestType } from '@/types/request.types';

export interface CreateRequestTypeDto {
  name: string;
  slaDays: number;
  flow: string[];
  isActive?: boolean;
}

export const requestTypesApi = {
  async list(): Promise<RequestType[]> {
    const res = await api.get<RequestType[]>('/request-types');
    return res.data;
  },

  async getById(id: string): Promise<RequestType> {
    const res = await api.get<RequestType>(`/request-types/${id}`);
    return res.data;
  },

  async create(data: CreateRequestTypeDto): Promise<RequestType> {
    const res = await api.post<RequestType>('/request-types', data);
    return res.data;
  },

  async update(id: string, data: CreateRequestTypeDto): Promise<RequestType> {
    const res = await api.patch<RequestType>(`/request-types/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<RequestType> {
    const res = await api.delete<RequestType>(`/request-types/${id}`);
    return res.data;
  },
};
