import { api } from './client';
import type { DashboardOverview, PeriodData, ResponseTimeData, UserActivityData } from '@/types/dashboard.types';
import type { ProtocolRequest } from '@/types/request.types';

export const dashboardApi = {
  async overview(): Promise<DashboardOverview> {
    const res = await api.get<DashboardOverview>('/dashboard/overview');
    return res.data;
  },

  async byPeriod(params: { from?: string; to?: string; granularity?: 'day' | 'week' | 'month' }): Promise<PeriodData[]> {
    const res = await api.get<PeriodData[]>('/dashboard/by-period', { params });
    return res.data;
  },

  async responseTime(): Promise<ResponseTimeData[]> {
    const res = await api.get<ResponseTimeData[]>('/dashboard/response-time');
    return res.data;
  },

  async userActivity(limit?: number): Promise<UserActivityData[]> {
    const res = await api.get<UserActivityData[]>('/dashboard/user-activity', { params: { limit } });
    return res.data;
  },

  async overdue(): Promise<ProtocolRequest[]> {
    const res = await api.get<ProtocolRequest[]>('/dashboard/overdue');
    return res.data;
  },
};
