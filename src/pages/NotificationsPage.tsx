import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import { Bell, CheckCheck, Loader2, Send, AlertTriangle, RefreshCw, CheckCircle, Paperclip } from 'lucide-react';

const TYPE_ICONS = {
  FORWARDED: Send,
  STATUS_CHANGED: RefreshCw,
  OVERDUE: AlertTriangle,
  RECEIVED: CheckCircle,
  ATTACHMENT_ADDED: Paperclip,
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Notificações</h1>
          <p className="text-surface-500 mt-1">{unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Nenhuma notificação pendente'}</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Marcar lidas</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : !notifications?.length ? (
        <div className="rounded-xl border border-surface-200 bg-white py-16 text-center">
          <Bell className="h-12 w-12 mx-auto text-surface-300 mb-3" />
          <p className="text-surface-500">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markReadMutation.mutate(n.id);
                  if (n.relatedRequestId) navigate(`/protocolos/${n.relatedRequestId}`);
                }}
                className={cn(
                  'rounded-xl border p-4 cursor-pointer transition-all hover:border-primary-200',
                  n.isRead ? 'border-surface-100 bg-white' : 'border-primary-100 bg-primary-50/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 rounded-lg p-2',
                    n.type === 'OVERDUE' ? 'bg-danger-50 text-danger-500'
                      : n.type === 'RECEIVED' ? 'bg-teal-50 text-teal-600'
                      : n.type === 'ATTACHMENT_ADDED' ? 'bg-emerald-50 text-emerald-600'
                      : n.type === 'STATUS_CHANGED' ? 'bg-orange-50 text-orange-600'
                      : 'bg-primary-50 text-primary-500',
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm', n.isRead ? 'text-surface-700' : 'text-surface-900 font-medium')}>
                        {n.title}
                      </p>
                      <span className="text-xs text-surface-400 shrink-0">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">{n.body}</p>
                  </div>
                  {!n.isRead && <div className="mt-2 h-2 w-2 rounded-full bg-primary-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
