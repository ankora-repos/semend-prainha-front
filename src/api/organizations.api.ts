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
  adminName: string;
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

export interface OrgAnalytics {
  totals: {
    organizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalRequests: number;
    totalOverdue: number;
  };
  perOrg: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
    totalUsers: number;
    totalRequests: number;
    totalSectors: number;
    totalRequestTypes: number;
    overdueRequests: number;
    loginsLast30d: number;
  }>;
  planDistribution: Array<{ plan: string; count: number }>;
  protocolsByMonth: Array<{ month: string; total: number }>;
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

  async uploadLogo(orgId: string, file: File): Promise<{ logo: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post<{ logo: string }>(`/organizations/${orgId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async removeLogo(orgId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/logo`);
  },

  async analytics(): Promise<OrgAnalytics> {
    const res = await api.get<OrgAnalytics>('/organizations/admin/analytics');
    return res.data;
  },
};
