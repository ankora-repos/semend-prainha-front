export type NotificationType =
  | 'FORWARDED'
  | 'STATUS_CHANGED'
  | 'OVERDUE'
  | 'DEADLINE_APPROACHING'
  | 'RECEIVED'
  | 'ATTACHMENT_ADDED';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
}
