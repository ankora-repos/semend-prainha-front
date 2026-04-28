import { api } from './client';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user.types';

export const usersApi = {
  async list(): Promise<User[]> {
    const res = await api.get<User[]>('/users');
    return res.data;
  },

  async getById(id: string): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const res = await api.post<User>('/users', data);
    return res.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const res = await api.patch<User>(`/users/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<User> {
    const res = await api.delete<User>(`/users/${id}`);
    return res.data;
  },
};
