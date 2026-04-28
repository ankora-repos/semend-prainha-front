import { api, setAccessToken } from './client';
import type { LoginRequest, LoginResponse, AuthUser } from '@/types/auth.types';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', data);
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  async refresh(): Promise<string> {
    const res = await api.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(res.data.accessToken);
    return res.data.accessToken;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    setAccessToken(null);
  },
};
