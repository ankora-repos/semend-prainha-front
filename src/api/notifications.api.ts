import { api } from './client';
import type { Notification } from '@/types/notification.types';

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const res = await api.get<Notification[]>('/notifications');
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
