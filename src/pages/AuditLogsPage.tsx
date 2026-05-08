import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/api/audit-logs.api';
import { formatDateTime } from '@/lib/format';
import {
  Loader2, ScrollText, ChevronLeft, ChevronRight, User, FileText,
  Send, Eye, Upload, Pencil, Download, LogIn, LogOut, UserPlus,
  Shield, Building2, ClipboardList, Bell, ChevronDown, ChevronUp,
  Trash2, RotateCcw, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditLog, AuditLogListParams } from '@/types/audit.types';
import type { LucideIcon } from 'lucide-react';

// ─── Helpers ───

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Human-readable action translation ───

interface ActionInfo {
  label: string;
  icon: LucideIcon;
  color: string; // tailwind bg color class
  iconColor: string;
}

const STATUS_LABELS: Record<string, string> = {
  PROTOCOLADO: 'Protocolado',
  RECEBIDO_PELO_SETOR: 'Recebido pelo Setor',
  EM_ANALISE: 'Em Análise',
  PENDENTE_DOCUMENTO: 'Pendente de Documento',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
  CONCLUIDO: 'Concluído',
};

function translateAction(log: AuditLog): ActionInfo & { description: string; details?: string } {
  const action = log.action;
  const after = log.payloadAfter ?? {};
  const before = log.payloadBefore ?? {};

  // ── Custom actions (logged manually via AuditService) ──

  // Dashboard views
  if (action === 'VIEW_DASHBOARD_OVERVIEW') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou o painel geral' };
  }
  if (action === 'VIEW_DASHBOARD_BY_PERIOD') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou protocolos por período no painel' };
  }
  if (action === 'VIEW_DASHBOARD_BY_TYPE') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou protocolos por tipo no painel' };
  }
  if (action === 'VIEW_DASHBOARD_RESPONSE_TIME') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou tempo de resposta dos setores no painel' };
  }
  if (action === 'VIEW_DASHBOARD_OVERDUE') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou protocolos atrasados no painel' };
  }
  if (action === 'VIEW_DASHBOARD_USER_ACTIVITY') {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou atividade dos usuários no painel' };
  }
  if (action.startsWith('VIEW_DASHBOARD')) {
    return { label: 'Consulta', icon: Eye, color: 'bg-blue-50', iconColor: 'text-blue-600', description: 'Consultou informações do painel' };
  }

  // Token / Auth
  if (action === 'TOKEN_REFRESH') {
    return { label: 'Sessão', icon: RotateCcw, color: 'bg-gray-50', iconColor: 'text-gray-500', description: 'Renovou a sessão de acesso' };
  }
  if (action === 'LOGIN') {
    return { label: 'Acesso', icon: LogIn, color: 'bg-green-50', iconColor: 'text-green-600', description: 'Realizou login no sistema' };
  }
  if (action === 'LOGOUT') {
    return { label: 'Saída', icon: LogOut, color: 'bg-gray-50', iconColor: 'text-gray-600', description: 'Saiu do sistema' };
  }

  // Protocol operations
  if (action === 'CREATE_PROTOCOL') {
    const proto = after.protocolNumber ?? '';
    return {
      label: 'Criação',
      icon: FileText,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      description: `Criou o protocolo ${proto}`,
      details: [
        after.requestType ? `Tipo: ${after.requestType}` : null,
        after.sectorOrigin ? `Setor de origem: ${after.sectorOrigin}` : null,
        after.description ? `Descrição: ${String(after.description).slice(0, 120)}` : null,
        after.requesterName ? `Solicitante: ${after.requesterName}` : null,
      ].filter(Boolean).join(' · '),
    };
  }
  if (action === 'VIEW_PROTOCOL') {
    const proto = after.protocolNumber ?? '';
    return {
      label: 'Visualização',
      icon: Eye,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: `Visualizou o protocolo ${proto}`,
      details: [
        after.status ? `Status: ${STATUS_LABELS[after.status as string] ?? after.status}` : null,
        after.currentSector ? `Setor atual: ${after.currentSector}` : null,
      ].filter(Boolean).join(' · '),
    };
  }
  if (action === 'FORWARD_PROTOCOL') {
    const proto = after.protocolNumber ?? '';
    return {
      label: 'Tramitação',
      icon: Send,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: `Encaminhou o protocolo ${proto}`,
      details: [
        after.fromSectorName && after.toSectorName ? `De ${after.fromSectorName} (${after.fromSector}) para ${after.toSectorName} (${after.toSector})` : null,
        after.notes ? `Observações: ${after.notes}` : null,
      ].filter(Boolean).join(' · '),
    };
  }
  if (action === 'RECEIVE_PROTOCOL') {
    const proto = after.protocolNumber ?? '';
    return {
      label: 'Recebimento',
      icon: CheckCircle,
      color: 'bg-teal-50',
      iconColor: 'text-teal-600',
      description: `Confirmou recebimento do protocolo ${proto}`,
      details: after.sectorName ? `Setor: ${after.sectorName} (${after.sector})` : undefined,
    };
  }
  if (action === 'CHANGE_STATUS') {
    const proto = after.protocolNumber ?? '';
    const prev = STATUS_LABELS[after.previousStatus as string] ?? after.previousStatus ?? '';
    const next = STATUS_LABELS[after.newStatus as string] ?? after.newStatus ?? '';
    return {
      label: 'Alteração de Status',
      icon: FileText,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: `Alterou status do protocolo ${proto}`,
      details: [
        prev && next ? `De "${prev}" para "${next}"` : null,
        after.justification ? `Justificativa: ${after.justification}` : null,
      ].filter(Boolean).join(' · '),
    };
  }
  if (action === 'VIEW_ATTACHMENT') {
    return {
      label: 'Visualização',
      icon: Eye,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Visualizou um anexo',
      details: after.filename ? `Arquivo: ${after.filename}` : undefined,
    };
  }
  if (action === 'UPLOAD_ATTACHMENT') {
    return {
      label: 'Envio de Anexo',
      icon: Upload,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      description: 'Anexou um arquivo ao protocolo',
      details: [
        after.filename ? `Arquivo: ${after.filename}` : null,
        after.mimeType ? `Tipo: ${after.mimeType}` : null,
        after.sizeBytes ? `Tamanho: ${formatBytes(after.sizeBytes as number)}` : null,
      ].filter(Boolean).join(' · '),
    };
  }
  if (action === 'RENAME_ATTACHMENT') {
    return {
      label: 'Renomeação',
      icon: Pencil,
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      description: 'Renomeou um anexo',
      details: before.filename && after.filename
        ? `De "${before.filename}" para "${after.filename}"`
        : undefined,
    };
  }
  if (action === 'DOWNLOAD_ATTACHMENT') {
    return {
      label: 'Baixar Anexo',
      icon: Download,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: 'Baixou um anexo',
      details: after.filename ? `Arquivo: ${after.filename}` : undefined,
    };
  }
  if (action === 'VIEW_AUDIT_LOGS') {
    return {
      label: 'Consulta',
      icon: ScrollText,
      color: 'bg-gray-50',
      iconColor: 'text-gray-600',
      description: 'Consultou os logs de auditoria',
    };
  }

  // ── Interceptor-generated actions (METHOD:/path) ──
  const methodMatch = action.match(/^(POST|PATCH|PUT|DELETE):\/(.+)/);
  if (methodMatch) {
    const [, method, path] = methodMatch;
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0];

    // Auth
    if (resource === 'auth') {
      if (segments[1] === 'login') return { label: 'Acesso', icon: LogIn, color: 'bg-green-50', iconColor: 'text-green-600', description: 'Realizou login no sistema' };
      if (segments[1] === 'logout') return { label: 'Saída', icon: LogOut, color: 'bg-gray-50', iconColor: 'text-gray-600', description: 'Saiu do sistema' };
      if (segments[1] === 'refresh') return { label: 'Sessão', icon: RotateCcw, color: 'bg-gray-50', iconColor: 'text-gray-500', description: 'Renovou a sessão de acesso' };
    }

    // Requests (Protocolos)
    if (resource === 'requests') {
      // POST /requests/:id/forward
      if (segments.includes('forward')) {
        const toSector = after.toSectorCode ?? after.toSectorId;
        return {
          label: 'Tramitação',
          icon: Send,
          color: 'bg-purple-50',
          iconColor: 'text-purple-600',
          description: 'Encaminhou um protocolo para outro setor',
          details: toSector ? `Destino: ${toSector}${after.notes ? ` — "${after.notes}"` : ''}` : undefined,
        };
      }
      // POST /requests/:id/receive
      if (segments.includes('receive')) {
        return { label: 'Recebimento', icon: CheckCircle, color: 'bg-teal-50', iconColor: 'text-teal-600', description: 'Confirmou o recebimento de um protocolo' };
      }
      // PATCH /requests/:id/status
      if (segments.includes('status')) {
        const newStatus = (after.status as string) ?? '';
        return {
          label: 'Alteração de Status',
          icon: FileText,
          color: 'bg-orange-50',
          iconColor: 'text-orange-600',
          description: `Alterou o status de um protocolo para "${STATUS_LABELS[newStatus] ?? newStatus}"`,
          details: after.justification ? `Justificativa: ${after.justification}` : undefined,
        };
      }
      // POST /requests/:id/attachments
      if (segments.includes('attachments')) {
        return { label: 'Envio de Anexo', icon: Upload, color: 'bg-emerald-50', iconColor: 'text-emerald-600', description: 'Anexou um arquivo ao protocolo' };
      }
      // POST /requests (create)
      if (method === 'POST' && segments.length === 1) {
        return {
          label: 'Criação',
          icon: FileText,
          color: 'bg-green-50',
          iconColor: 'text-green-600',
          description: 'Criou um novo protocolo',
          details: after.description ? `Descrição: ${String(after.description).slice(0, 100)}` : undefined,
        };
      }
    }

    // Users
    if (resource === 'users') {
      if (method === 'POST') return { label: 'Cadastro', icon: UserPlus, color: 'bg-green-50', iconColor: 'text-green-600', description: `Cadastrou um novo usuário`, details: after.name ? `Nome: ${after.name}` : undefined };
      if (method === 'PATCH') return { label: 'Edição', icon: Pencil, color: 'bg-amber-50', iconColor: 'text-amber-600', description: 'Atualizou dados de um usuário', details: after.name ? `Usuário: ${after.name}` : undefined };
      if (method === 'DELETE') return { label: 'Desativação', icon: Trash2, color: 'bg-red-50', iconColor: 'text-red-600', description: 'Desativou um usuário' };
    }

    // Roles
    if (resource === 'roles') {
      if (method === 'POST') return { label: 'Criação', icon: Shield, color: 'bg-green-50', iconColor: 'text-green-600', description: 'Criou um novo perfil de acesso', details: after.name ? `Perfil: ${after.name}` : undefined };
      if (method === 'PATCH') return { label: 'Edição', icon: Pencil, color: 'bg-amber-50', iconColor: 'text-amber-600', description: 'Atualizou um perfil de acesso', details: after.name ? `Perfil: ${after.name}` : undefined };
    }

    // Sectors
    if (resource === 'sectors') {
      if (method === 'POST') return { label: 'Criação', icon: Building2, color: 'bg-green-50', iconColor: 'text-green-600', description: 'Criou um novo setor', details: after.name ? `Setor: ${after.name} (${after.code ?? ''})` : undefined };
      if (method === 'PATCH') return { label: 'Edição', icon: Pencil, color: 'bg-amber-50', iconColor: 'text-amber-600', description: 'Atualizou dados de um setor', details: after.name ? `Setor: ${after.name}` : undefined };
    }

    // Request Types
    if (resource === 'request-types') {
      if (method === 'POST') return { label: 'Criação', icon: ClipboardList, color: 'bg-green-50', iconColor: 'text-green-600', description: 'Criou um novo tipo de solicitação', details: after.name ? `Tipo: ${after.name}` : undefined };
      if (method === 'PATCH') return { label: 'Edição', icon: Pencil, color: 'bg-amber-50', iconColor: 'text-amber-600', description: 'Atualizou um tipo de solicitação', details: after.name ? `Tipo: ${after.name}` : undefined };
      if (method === 'DELETE') return { label: 'Desativação', icon: Trash2, color: 'bg-red-50', iconColor: 'text-red-600', description: 'Desativou um tipo de solicitação' };
    }

    // Notifications
    if (resource === 'notifications') {
      return { label: 'Notificação', icon: Bell, color: 'bg-sky-50', iconColor: 'text-sky-600', description: 'Interagiu com notificações' };
    }
  }

  // Fallback
  return {
    label: 'Ação',
    icon: ScrollText,
    color: 'bg-gray-50',
    iconColor: 'text-gray-500',
    description: action,
  };
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  requests: 'Protocolo',
  Request: 'Protocolo',
  Attachment: 'Anexo',
  users: 'Usuário',
  roles: 'Perfil',
  sectors: 'Setor',
  'request-types': 'Tipo de Solicitação',
  auth: 'Autenticação',
  'audit-logs': 'Auditoria',
  notifications: 'Notificação',
  dashboard: 'Painel',
  'refresh-token': 'Autenticação',
};

function AuditLogCard({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const info = translateAction(log);
  const Icon = info.icon;
  const entityLabel = ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType;

  return (
    <div className="rounded-xl border border-surface-200 bg-white overflow-hidden hover:border-surface-300 transition-colors">
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', info.color)}>
          <Icon className={cn('h-5 w-5', info.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn('rounded-lg px-2 py-0.5 text-xs font-bold', info.color, info.iconColor)}>
              {info.label}
            </span>
            <span className="rounded-lg bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
              {entityLabel}
            </span>
          </div>

          <p className="text-sm text-surface-800 font-medium">{info.description}</p>

          {info.details && (
            <p className="text-xs text-surface-500 mt-1">{info.details}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {log.actorName ?? 'Usuário desconhecido'}
            </span>
            <span>{formatDateTime(log.createdAt)}</span>
            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
          </div>
        </div>

        {/* Expand details */}
        {(log.payloadBefore || log.payloadAfter) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
            title="Ver detalhes técnicos"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-surface-100 bg-surface-50 px-4 py-3 space-y-2">
          {log.payloadBefore && (
            <div>
              <p className="text-xs font-bold text-surface-500 mb-1">Estado anterior:</p>
              <pre className="text-xs text-surface-600 bg-white rounded-lg p-2 border border-surface-100 overflow-x-auto max-h-40">
                {JSON.stringify(log.payloadBefore, null, 2)}
              </pre>
            </div>
          )}
          {log.payloadAfter && (
            <div>
              <p className="text-xs font-bold text-surface-500 mb-1">Dados enviados:</p>
              <pre className="text-xs text-surface-600 bg-white rounded-lg p-2 border border-surface-100 overflow-x-auto max-h-40">
                {JSON.stringify(log.payloadAfter, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditLogsPage() {
  const [params, setParams] = useState<AuditLogListParams>({ page: 1, limit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogsApi.list(params),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Auditoria</h1>
        <p className="text-surface-500 mt-1">Registro de todas as ações realizadas no sistema</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={params.entityType || ''}
          onChange={(e) => setParams({ ...params, entityType: e.target.value || undefined, page: 1 })}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
        >
          <option value="">Todas as categorias</option>
          <option value="auth">Autenticação</option>
          <option value="requests">Protocolos</option>
          <option value="Request">Protocolos (atividades)</option>
          <option value="Attachment">Anexos</option>
          <option value="users">Usuários</option>
          <option value="sectors">Setores</option>
          <option value="roles">Perfis</option>
          <option value="request-types">Tipos de Solicitação</option>
          <option value="dashboard">Painel</option>
        </select>
        <input
          type="date"
          value={params.from || ''}
          onChange={(e) => setParams({ ...params, from: e.target.value || undefined, page: 1 })}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
        />
        <input
          type="date"
          value={params.to || ''}
          onChange={(e) => setParams({ ...params, to: e.target.value || undefined, page: 1 })}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
      ) : !data?.data.length ? (
        <div className="rounded-xl border border-surface-200 bg-white py-16 text-center">
          <ScrollText className="h-12 w-12 mx-auto text-surface-300 mb-3" />
          <p className="text-surface-500">Nenhum registro encontrado</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((log) => (
              <AuditLogCard key={log.id} log={log} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} registros)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setParams((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                  disabled={data.meta.page <= 1}
                  className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, page: Math.min(data.meta.totalPages, (p.page ?? 1) + 1) }))}
                  disabled={data.meta.page >= data.meta.totalPages}
                  className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
