import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { requestsApi } from '@/api/requests.api';
import { sectorsApi } from '@/api/sectors.api';
import { requestTypesApi } from '@/api/request-types.api';
import { formatStatus, statusColor, formatDate, formatDeadline } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RequestStatus, ListRequestsParams } from '@/types/request.types';
import { Filter, ChevronLeft, ChevronRight, Plus, Loader2, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ALL_STATUSES: RequestStatus[] = [
  'PROTOCOLADO', 'RECEBIDO_PELO_SETOR', 'EM_ANALISE',
  'PENDENTE_DOCUMENTO', 'DEFERIDO', 'INDEFERIDO', 'CONCLUIDO',
];

export function RequestsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [params, setParams] = useState<ListRequestsParams>({ page: 1, limit: 15 });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['requests', params],
    queryFn: () => requestsApi.list(params),
  });

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.list(),
  });

  const { data: requestTypes } = useQuery({
    queryKey: ['request-types'],
    queryFn: () => requestTypesApi.list(),
  });

  function updateFilter(key: keyof ListRequestsParams, value: string | boolean | undefined) {
    setParams((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  const FINAL_STATUSES = ['DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'];

  function getProgress(req: { requestType: { id: string }; currentSector: { code: string }; status: string }) {
    if (FINAL_STATUSES.includes(req.status)) return 100;
    const rt = requestTypes?.find((t) => t.id === req.requestType.id);
    if (!rt || rt.flow.length <= 1) return 0;
    const idx = rt.flow.indexOf(req.currentSector.code);
    if (idx === -1) return 0;
    return Math.round((idx / (rt.flow.length - 1)) * 100);
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Protocolos</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">
            {data?.meta.total ?? 0} protocolo{(data?.meta.total ?? 0) !== 1 ? 's' : ''} encontrado{(data?.meta.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              showFilters
                ? 'border-primary-200 bg-primary-50 text-primary-700 ring-2 ring-primary-100 shadow-sm'
                : 'border-surface-200/60 bg-white text-surface-600 hover:bg-surface-50 hover:border-surface-300 shadow-xs hover:shadow-sm hover:text-surface-900',
            )}
          >
            <Filter className={cn("h-4 w-4 transition-transform duration-200", showFilters && "rotate-180")} />
            Filtros
          </button>
          {can('send') && (
            <button
              onClick={() => navigate('/protocolos/novo')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Protocolo</span>
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-surface-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilter('search', searchInput.trim());
          }}
          placeholder="Buscar por número do protocolo ou nome do solicitante..."
          className="w-full rounded-2xl border border-surface-200/60 bg-white pl-11 pr-24 py-3 text-sm font-medium text-surface-900 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all shadow-xs placeholder:text-surface-400"
        />
        <button
          onClick={() => updateFilter('search', searchInput.trim())}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-6 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Status</label>
              <select
                value={params.status || ''}
                onChange={(e) => updateFilter('status', e.target.value as RequestStatus)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              >
                <option value="">Todos</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Setor Atual</label>
              <select
                value={params.sectorCode || ''}
                onChange={(e) => updateFilter('sectorCode', e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              >
                <option value="">Todos</option>
                {sectors?.map((s) => (
                  <option key={s.id} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Tipo de Solicitação</label>
              <select
                value={params.requestTypeId || ''}
                onChange={(e) => updateFilter('requestTypeId', e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              >
                <option value="">Todos</option>
                {requestTypes?.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Data início</label>
              <input
                type="date"
                value={params.from || ''}
                onChange={(e) => updateFilter('from', e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Data fim</label>
              <input
                type="date"
                value={params.to || ''}
                onChange={(e) => updateFilter('to', e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="group flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-surface-50 transition-colors w-full border border-transparent hover:border-surface-200/60">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={params.isOverdue === true}
                    onChange={(e) => updateFilter('isOverdue', e.target.checked ? true : undefined)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded border-2 border-surface-300 bg-white peer-checked:border-danger-500 peer-checked:bg-danger-500 transition-colors"></div>
                  <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-surface-700 group-hover:text-surface-900">Apenas atrasados</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Table Area */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-surface-500 font-medium">Buscando protocolos...</p>
          </div>
        </div>
      ) : !data?.data.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum protocolo encontrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px]">Tente ajustar os filtros ou criar um novo protocolo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table (Visible on md and up) */}
          <div className="hidden md:block rounded-2xl border border-surface-200/60 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200/60 bg-surface-50/80">
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Protocolo</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Setor Atual</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Progresso</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Prazo</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-sm">
                  {data.data.map((req) => {
                    const colors = statusColor(req.status);
                    return (
                      <tr
                        key={req.id}
                        onClick={() => navigate(`/protocolos/${req.id}`)}
                        className="group hover:bg-surface-50 cursor-pointer transition-all duration-200"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary-700 group-hover:text-primary-800 transition-colors">
                              {req.protocolNumber}
                            </span>
                            {req.isOverdue && (
                              <div title="Prazo esgotado" className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-50">
                                <AlertTriangle className="h-3 w-3 text-danger-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-surface-500 mt-1 line-clamp-1" title={req.requester.name}>
                            {req.requester.name}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="font-medium text-surface-700 line-clamp-2">
                            {req.requestType.name}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold', colors.bg, colors.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                            {formatStatus(req.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-1 text-xs font-semibold text-surface-700 truncate max-w-[150px]" title={req.currentSector.name}>
                            {req.currentSector.name}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {(() => {
                            const pct = getProgress(req);
                            return (
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      pct === 100 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-400',
                                    )}
                                    style={{ width: `${Math.max(pct, 4)}%` }}
                                  />
                                </div>
                                <span className={cn(
                                  'text-xs font-bold tabular-nums w-9 text-right',
                                  pct === 100 ? 'text-success-600' : 'text-surface-500',
                                )}>
                                  {pct}%
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={cn('inline-flex items-center text-[13px] font-semibold', req.isOverdue ? 'text-danger-600 bg-danger-50 px-2.5 py-1 rounded-md' : 'text-surface-600')}>
                            {formatDeadline(req.deadlineAt, req.isOverdue)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top text-[13px] font-semibold text-surface-500 whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (Visible below md) */}
          <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4">
            {data.data.map((req) => {
              const colors = statusColor(req.status);
              return (
                <Link
                  key={req.id}
                  to={`/protocolos/${req.id}`}
                  className="block rounded-2xl border border-surface-200/60 bg-white p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 font-bold text-xs ring-1 ring-primary-100">
                        {req.protocolNumber.slice(-4)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-surface-900 block">{req.protocolNumber}</span>
                        <span className="text-xs font-medium text-surface-500">{formatDate(req.createdAt)}</span>
                      </div>
                    </div>
                    {req.isOverdue && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-50">
                        <AlertTriangle className="h-4 w-4 text-danger-500" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm font-semibold text-surface-800 mb-4 line-clamp-2">
                    {req.requestType.name}
                  </p>
                  
                  {/* Progress bar */}
                  {(() => {
                    const pct = getProgress(req);
                    return (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              pct === 100 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-400',
                            )}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-[11px] font-bold tabular-nums',
                          pct === 100 ? 'text-success-600' : 'text-surface-400',
                        )}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between border-t border-surface-100 pt-4 mt-auto">
                    <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-1 text-xs font-semibold text-surface-700 max-w-[50%] truncate">
                      {req.currentSector.name}
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold', colors.bg, colors.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                      {formatStatus(req.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-surface-200/60 shadow-xs mt-4">
              <p className="text-sm font-medium text-surface-500">
                Mostrando <span className="font-bold text-surface-900">{data.data.length}</span> de <span className="font-bold text-surface-900">{data.meta.total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParams((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                  disabled={data.meta.page <= 1}
                  className="flex items-center justify-center h-9 w-9 rounded-xl border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="hidden sm:flex items-center gap-1 px-2">
                  <span className="text-sm font-bold text-surface-900">{data.meta.page}</span>
                  <span className="text-sm font-medium text-surface-500">de {data.meta.totalPages}</span>
                </div>
                <button
                  onClick={() => setParams((p) => ({ ...p, page: Math.min(data.meta.totalPages, (p.page ?? 1) + 1) }))}
                  disabled={data.meta.page >= data.meta.totalPages}
                  className="flex items-center justify-center h-9 w-9 rounded-xl border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
