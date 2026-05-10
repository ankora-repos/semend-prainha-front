import { api } from './client';
import type { Role } from '@/types/auth.types';

export interface CreateRoleDto {
  name: string;
  slug: string;
  permissions: {
    view: boolean;
    edit: boolean;
    send: boolean;
    receive: boolean;
    approve: boolean;
    reject: boolean;
  };
}

export const rolesApi = {
  async list(): Promise<Role[]> {
    const res = await api.get<Role[]>('/roles');
    return res.data;
  },

  async getById(id: string): Promise<Role> {
    const res = await api.get<Role>(`/roles/${id}`);
    return res.data;
  },

  async create(data: CreateRoleDto): Promise<Role> {
    const res = await api.post<Role>('/roles', data);
    return res.data;
  },

  async update(id: string, data: CreateRoleDto): Promise<Role> {
    const res = await api.patch<Role>(`/roles/${id}`, data);
    return res.data;
  },
};
