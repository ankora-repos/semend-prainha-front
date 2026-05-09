import { api } from './client';

export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
  plan: string;
  isActive: boolean;
  _count?: {
    users: number;
    requests: number;
  };
  createdAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  plan?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  plan?: string;
  logo?: string | null;
  primaryColor?: string | null;
}

export const organizationsApi = {
  async list(): Promise<OrganizationListItem[]> {
    const res = await api.get<OrganizationListItem[]>('/organizations');
    return res.data;
  },

  async getById(id: string): Promise<OrganizationListItem> {
    const res = await api.get<OrganizationListItem>(`/organizations/${id}`);
    return res.data;
  },

  async create(data: CreateOrganizationDto): Promise<OrganizationListItem> {
    const res = await api.post<OrganizationListItem>('/organizations', data);
    return res.data;
  },

  async update(id: string, data: UpdateOrganizationDto): Promise<OrganizationListItem> {
    const res = await api.patch<OrganizationListItem>(`/organizations/${id}`, data);
    return res.data;
  },

  async deactivate(id: string): Promise<OrganizationListItem> {
    const res = await api.patch<OrganizationListItem>(`/organizations/${id}/deactivate`);
    return res.data;
  },
};
