const STATUS_LABELS: Record<string, string> = {
  PROTOCOLADO: 'Protocolado',
  RECEBIDO_PELO_SETOR: 'Recebido pelo Setor',
  EM_ANALISE: 'Em Análise',
  PENDENTE_DOCUMENTO: 'Pendente de Documento',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
  CONCLUIDO: 'Concluído',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PROTOCOLADO: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  RECEBIDO_PELO_SETOR: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  EM_ANALISE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  PENDENTE_DOCUMENTO: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  DEFERIDO: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  INDEFERIDO: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  CONCLUIDO: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string) {
  return STATUS_COLORS[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDeadline(deadlineAt: string, isOverdue: boolean): string {
  const formatted = formatDate(deadlineAt);
  return isOverdue ? `${formatted} (Atrasado)` : formatted;
}

export function formatRelativeTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(iso);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
