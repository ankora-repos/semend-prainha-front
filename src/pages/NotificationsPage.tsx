import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import type { NotificationType } from '@/types/notification.types';
import {
  Bell,
  CheckCheck,
  Loader2,
  Send,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Paperclip,
  Clock,
  Filter,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; colorClass: string }> = {
  FORWARDED: { icon: Send, label: 'Tramitado', colorClass: 'bg-primary-50 text-primary-500' },
  STATUS_CHANGED: { icon: RefreshCw, label: 'Status alterado', colorClass: 'bg-orange-50 text-orange-600' },
  OVERDUE: { icon: AlertTriangle, label: 'Atrasado', colorClass: 'bg-danger-50 text-danger-500' },
  DEADLINE_APPROACHING: { icon: Clock, label: 'Prazo proximo', colorClass: 'bg-amber-50 text-amber-600' },
  RECEIVED: { icon: CheckCircle, label: 'Recebido', colorClass: 'bg-teal-50 text-teal-600' },
  ATTACHMENT_ADDED: { icon: Paperclip, label: 'Anexo', colorClass: 'bg-emerald-50 text-emerald-600' },
};

type FilterTab = 'all' | 'unread' | NotificationType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Nao lidas' },
  { key: 'FORWARDED', label: 'Tramitados' },
  { key: 'OVERDUE', label: 'Atrasados' },
  { key: 'DEADLINE_APPROACHING', label: 'Prazo proximo' },
  { key: 'STATUS_CHANGED', label: 'Status' },
  { key: 'RECEIVED', label: 'Recebidos' },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filtered = notifications?.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Notificacoes</h1>
          <p className="text-surface-500 mt-1">
            {unread > 0
              ? `${unread} nao lida${unread > 1 ? 's' : ''}`
              : 'Nenhuma notificacao pendente'}
          </p>
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

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <Filter className="h-4 w-4 text-surface-400 shrink-0" />
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? notifications?.length ?? 0
              : tab.key === 'unread'
                ? unread
                : notifications?.filter((n) => n.type === tab.key).length ?? 0;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all border',
                activeFilter === tab.key
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-surface-500 border-surface-200 hover:bg-surface-50 hover:text-surface-700',
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    activeFilter === tab.key
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-surface-100 text-surface-500',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : !filtered?.length ? (
        <div className="rounded-xl border border-surface-200 bg-white py-16 text-center">
          <Bell className="h-12 w-12 mx-auto text-surface-300 mb-3" />
          <p className="text-surface-500">
            {activeFilter === 'all'
              ? 'Nenhuma notificacao'
              : 'Nenhuma notificacao neste filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? {
              icon: Bell,
              label: n.type,
              colorClass: 'bg-surface-100 text-surface-500',
            };
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markReadMutation.mutate(n.id);
                  if (n.relatedRequestId) navigate(`/protocolos/${n.relatedRequestId}`);
                }}
                className={cn(
                  'rounded-xl border p-4 cursor-pointer transition-all hover:border-primary-200 hover:shadow-sm',
                  n.isRead
                    ? 'border-surface-100 bg-white'
                    : 'border-primary-100 bg-primary-50/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 rounded-lg p-2', config.colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p
                          className={cn(
                            'text-sm truncate',
                            n.isRead ? 'text-surface-700' : 'text-surface-900 font-medium',
                          )}
                        >
                          {n.title}
                        </p>
                        <span
                          className={cn(
                            'hidden sm:inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold shrink-0',
                            config.colorClass,
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xs text-surface-400 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">{n.body}</p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
