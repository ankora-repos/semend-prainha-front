export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'FORWARDED' | 'STATUS_CHANGED' | 'OVERDUE' | 'RECEIVED' | 'ATTACHMENT_ADDED';
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
}
