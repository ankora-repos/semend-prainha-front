import { api } from './client';
import type { Sector } from '@/types/auth.types';

export const sectorsApi = {
  async list(): Promise<Sector[]> {
    const res = await api.get<Sector[]>('/sectors');
    return res.data;
  },

  async getById(id: string): Promise<Sector> {
    const res = await api.get<Sector>(`/sectors/${id}`);
    return res.data;
  },

  async create(data: { name: string; code: string }): Promise<Sector> {
    const res = await api.post<Sector>('/sectors', data);
    return res.data;
  },

  async update(id: string, data: { name?: string; code?: string }): Promise<Sector> {
    const res = await api.patch<Sector>(`/sectors/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<Sector> {
    const res = await api.delete<Sector>(`/sectors/${id}`);
    return res.data;
  },
};
