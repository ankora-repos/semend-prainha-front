import { useState } from 'react';
import { api } from '@/api/client';
import { statusColor, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Search, Loader2, FileText, Clock, Building2, ArrowRight,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';

interface LookupResult {
  id: string;
  protocolNumber: string;
  description: string;
  status: string;
  createdAt: string;
  deadlineAt: string;
  requesterName: string | null;
  requesterCpf: string | null;
  isOverdue: boolean;
  progress: number;
  requestType: { name: string; flow: string[] };
  currentSector: { name: string; code: string };
  sectorOrigin: { name: string };
  statusHistory: { newStatus: string; changedAt: string; justification: string | null }[];
  tramitations: { fromSector: { name: string }; toSector: { name: string }; sentAt: string; receivedAt: string | null; notes: string | null }[];
}

function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
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

export function PublicLookupPage() {
  const [mode, setMode] = useState<'cpf' | 'matricula' | 'protocolo'>('cpf');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResults(null);

    const params: Record<string, string> = {};
    if (mode === 'cpf') {
      const clean = cpf.replace(/\D/g, '');
      if (clean.length < 11) return setError('CPF deve ter 11 dígitos');
      params.cpf = clean;
    } else if (mode === 'matricula') {
      if (!matricula.trim()) return setError('Informe a matrícula');
      params.registrationNumber = matricula.trim();
    } else {
      if (!protocolo.trim()) return setError('Informe o número do protocolo');
      params.protocolNumber = protocolo.trim();
    }

    setLoading(true);
    try {
      const res = await api.get<LookupResult[]>('/requests/public/lookup', { params });
      setResults(res.data);
      if (res.data.length === 0) setError('Nenhum protocolo encontrado com os dados informados.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white font-black text-sm">
            SP
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">SEMED Prainha</h1>
            <p className="text-xs text-surface-500">Consulta de Protocolos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
            Acompanhe seus Protocolos
          </h2>
          <p className="text-surface-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Consulte o andamento das suas solicitações na Secretaria Municipal de Educação de Prainha
          </p>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSearch} className="rounded-2xl border border-surface-200/60 bg-white shadow-sm p-6 sm:p-8 mb-8">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-surface-100 p-1 mb-6">
            {([
              { key: 'cpf' as const, label: 'CPF' },
              { key: 'matricula' as const, label: 'Matrícula' },
              { key: 'protocolo' as const, label: 'N. Protocolo' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setError(''); setResults(null); }}
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
                  mode === key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            {mode === 'cpf' && (
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
              />
            )}
            {mode === 'matricula' && (
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Número da matrícula"
                className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
              />
            )}
            {mode === 'protocolo' && (
              <input
                type="text"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value)}
                placeholder="Ex: PROT-2026-00001"
                className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Consultar
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-danger-600 bg-danger-50 rounded-lg px-4 py-2.5 font-medium">{error}</p>
          )}
        </form>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-surface-500">
              {results.length} protocolo{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>

            {results.map((r) => {
              const colors = statusColor(r.status as any);
              const isExpanded = expandedId === r.id;
              const flow = r.requestType.flow as string[];

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-surface-200/60 bg-white shadow-xs overflow-hidden transition-all hover:shadow-sm"
                >
                  {/* Card header */}
                  <div
                    className="p-5 sm:p-6 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-surface-900">{r.protocolNumber}</p>
                          <p className="text-xs font-medium text-surface-500">{r.requestType.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold', colors.bg, colors.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-surface-400" /> : <ChevronDown className="h-4 w-4 text-surface-400" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-2.5 rounded-full bg-surface-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            r.progress === 100 ? 'bg-emerald-500' : r.progress >= 50 ? 'bg-primary-500' : 'bg-amber-400',
                          )}
                          style={{ width: `${Math.max(r.progress, 4)}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-sm font-bold tabular-nums',
                        r.progress === 100 ? 'text-emerald-600' : 'text-surface-500',
                      )}>
                        {r.progress}%
                      </span>
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-surface-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Aberto em {formatDate(r.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Setor atual: <span className="font-semibold text-surface-700">{r.currentSector.name}</span>
                      </span>
                      {r.isOverdue && (
                        <span className="inline-flex items-center gap-1.5 text-danger-600 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Prazo vencido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-surface-100 bg-surface-50/50 px-5 sm:px-6 py-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Descrição</h4>
                        <p className="text-sm text-surface-700 leading-relaxed">{r.description}</p>
                      </div>

                      {/* Flow visualization */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Fluxo de Tramitação</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {flow.map((code, i) => {
                            const isCurrent = code === r.currentSector.code;
                            const isPast = flow.indexOf(r.currentSector.code) > i || r.progress === 100;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div className={cn(
                                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition-all',
                                  isCurrent
                                    ? 'bg-primary-50 text-primary-700 border-primary-200 ring-2 ring-primary-100'
                                    : isPast
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-surface-50 text-surface-400 border-surface-200',
                                )}>
                                  {isPast && !isCurrent && <CheckCircle className="h-3 w-3" />}
                                  {isCurrent && <MapPin className="h-3 w-3" />}
                                  {code}
                                </div>
                                {i < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-surface-300" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline */}
                      {(r.statusHistory.length > 0 || r.tramitations.length > 0) && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Histórico</h4>
                          <div className="space-y-3">
                            {r.statusHistory.map((sh, i) => (
                              <div key={`s-${i}`} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-primary-400 mt-1.5" />
                                  {i < r.statusHistory.length - 1 && <div className="flex-1 w-px bg-surface-200 mt-1" />}
                                </div>
                                <div className="pb-3">
                                  <p className="text-sm font-semibold text-surface-800">
                                    Status alterado para {STATUS_LABELS[sh.newStatus] || sh.newStatus}
                                  </p>
                                  {sh.justification && (
                                    <p className="text-xs text-surface-500 mt-0.5">Justificativa: {sh.justification}</p>
                                  )}
                                  <p className="text-xs text-surface-400 mt-0.5">{formatDate(sh.changedAt)}</p>
                                </div>
                              </div>
                            ))}
                            {r.tramitations.map((t, i) => (
                              <div key={`t-${i}`} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400 mt-1.5" />
                                  {i < r.tramitations.length - 1 && <div className="flex-1 w-px bg-surface-200 mt-1" />}
                                </div>
                                <div className="pb-3">
                                  <p className="text-sm font-semibold text-surface-800">
                                    Tramitado de {t.fromSector.name} para {t.toSector.name}
                                  </p>
                                  {t.notes && <p className="text-xs text-surface-500 mt-0.5">{t.notes}</p>}
                                  <p className="text-xs text-surface-400 mt-0.5">
                                    Enviado em {formatDate(t.sentAt)}
                                    {t.receivedAt && ` — Recebido em ${formatDate(t.receivedAt)}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deadline info */}
                      <div className="flex items-center gap-2 text-xs text-surface-500 pt-2 border-t border-surface-200">
                        <Clock className="h-3.5 w-3.5" />
                        Prazo: {formatDate(r.deadlineAt)}
                        {r.isOverdue && <span className="text-danger-600 font-bold ml-1">(Vencido)</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty initial state */}
        {!results && !loading && (
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-primary-300" />
            </div>
            <p className="text-surface-500 text-sm max-w-xs mx-auto">
              Digite seu CPF, matrícula ou número do protocolo para consultar o andamento
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200/60 bg-white/60 backdrop-blur-sm py-6">
        <p className="text-center text-xs text-surface-400">
          Secretaria Municipal de Educação de Prainha — PA &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
