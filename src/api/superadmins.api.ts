import { api } from './client';

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export const superAdminsApi = {
  async list(): Promise<SuperAdminUser[]> {
    const res = await api.get<SuperAdminUser[]>('/superadmins');
    return res.data;
  },

  async promote(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(`/superadmins/${userId}/promote`);
    return res.data;
  },

  async demote(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(`/superadmins/${userId}/demote`);
    return res.data;
  },
};
