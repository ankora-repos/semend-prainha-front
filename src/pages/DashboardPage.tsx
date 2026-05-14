import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatStatus } from '@/lib/format';
import { cn } from '@/lib/utils';
import { FileText, AlertTriangle, CheckCircle2, Clock, Loader2, TrendingUp, BarChart as BarChartIcon, Users, CalendarClock, Layers, Link2, Check, Copy } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#3b5fff', '#0ea5e9', '#f59e0b', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

const PERIOD_OPTIONS = [
  { label: 'Última semana', value: 'week' as const },
  { label: 'Último mês', value: 'month' as const },
  { label: 'Últimos 3 meses', value: 'quarter' as const },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [periodGranularity, setPeriodGranularity] = useState<'week' | 'month' | 'quarter'>('week');
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.overview(),
    staleTime: 60_000,
  });

  const { data: responseTime } = useQuery({
    queryKey: ['dashboard', 'response-time'],
    queryFn: () => dashboardApi.responseTime(),
  });

  const { data: byPeriod } = useQuery({
    queryKey: ['dashboard', 'by-period', { granularity: periodGranularity }],
    queryFn: () => dashboardApi.byPeriod({ granularity: periodGranularity === 'quarter' ? 'month' : periodGranularity }),
  });

  const { data: userActivity } = useQuery({
    queryKey: ['dashboard', 'user-activity'],
    queryFn: () => dashboardApi.userActivity(10),
    staleTime: 60_000,
  });

  const { data: overdueProtocols } = useQuery({
    queryKey: ['dashboard', 'overdue'],
    queryFn: () => dashboardApi.overdue(),
    staleTime: 60_000,
  });

  const { data: byRequestType } = useQuery({
    queryKey: ['dashboard', 'by-request-type'],
    queryFn: () => dashboardApi.byRequestType(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const activeProtocols = (overview?.byStatus ?? [])
    .filter((s) => !['DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const completedProtocols = (overview?.byStatus ?? [])
    .filter((s) => ['DEFERIDO', 'CONCLUIDO'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const pieData = (overview?.byStatus ?? []).map((item) => ({
    ...item,
    name: formatStatus(item.status),
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Visão Geral</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">
            Acompanhe as métricas e indicadores do sistema de protocolos
          </p>
        </div>
      </div>

      {/* Public Consultation Link */}
      {organization?.slug && (
        <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/80 to-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800">Link de Consulta Pública</p>
            <p className="text-xs text-surface-500 mt-0.5 truncate">
              {`${window.location.origin}/consulta?slug=${organization.slug}`}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/consulta?slug=${organization.slug}`);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shrink-0',
              linkCopied
                ? 'bg-green-100 text-green-700'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
            )}
          >
            {linkCopied ? (
              <><Check className="h-4 w-4" /> Copiado!</>
            ) : (
              <><Copy className="h-4 w-4" /> Copiar link</>
            )}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SummaryCard
          icon={FileText}
          label="Total de Protocolos"
          value={overview?.total ?? 0}
          color="primary"
        />
        <SummaryCard
          icon={Clock}
          label="Em Andamento"
          value={activeProtocols}
          color="info"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Concluídos"
          value={completedProtocols}
          color="success"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Atrasados"
          value={overview?.overdue ?? 0}
          color="danger"
          highlight={!!overview?.overdue && overview.overdue > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] -z-0 opacity-50"></div>
          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-surface-100/80 text-surface-600">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">Distribuição por Status</h3>
          </div>
          
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                      stroke="transparent"
                      cornerRadius={6}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value}`, 'Protocolos']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '13px',
                        fontWeight: 500,
                        padding: '8px 12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Enhanced Legend list */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {pieData.map((item, i) => (
                  <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-3 w-3 rounded-full shrink-0 shadow-inner"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-surface-600 truncate">{formatStatus(item.status)}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-900 ml-2">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="Nenhum dado disponível" />
          )}
        </div>

        {/* Protocols by Period */}
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-info-50 rounded-bl-[100px] -z-0 opacity-50"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-surface-100/80 text-surface-600">
                <BarChartIcon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900">Evolução de Protocolos</h3>
            </div>
            <div className="flex gap-1 bg-surface-100 rounded-lg p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriodGranularity(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200',
                    periodGranularity === opt.value
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {byPeriod && byPeriod.length > 0 ? (
            <div className="h-[280px] mt-4 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPeriod} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    }
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tickMargin={12}
                  />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}
                    formatter={(value: any) => [`${value}`, 'Protocolos']}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '10px 14px'
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#3b5fff" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Nenhum dado disponível" />
          )}
        </div>
      </div>

      {/* By Request Type */}
      {byRequestType && byRequestType.length > 0 && (
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-0 opacity-50"></div>
          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 leading-tight">Por Tipo de Solicitação</h3>
              <p className="text-sm font-medium text-surface-500 mt-0.5">Total, no prazo e atrasados por tipo</p>
            </div>
          </div>

          {/* Legend outside the chart to avoid overlap */}
          <div className="flex items-center justify-center gap-6 mb-4 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#3b5fff' }} />
              <span className="text-sm font-semibold text-surface-600">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
              <span className="text-sm font-semibold text-surface-600">No Prazo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-sm font-semibold text-surface-600">Atrasados</span>
            </div>
          </div>

          <div className="h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRequestType} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tickMargin={8}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tickMargin={12}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '10px 14px',
                  }}
                />
                <Bar dataKey="total" name="Total" fill="#3b5fff" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="onTime" name="No Prazo" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="overdue" name="Atrasados" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Response Time */}
      {responseTime && responseTime.length > 0 && (
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-lg bg-success-50 text-success-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 leading-tight">Desempenho por Setor</h3>
              <p className="text-sm font-medium text-surface-500 mt-0.5">Tempo de triagem e recebimento de protocolos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {responseTime.map((sector) => (
              <div
                key={sector.sector_code}
                className="group rounded-xl border border-surface-200/60 bg-surface-50/50 p-5 hover:bg-white hover:border-surface-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center rounded-lg bg-surface-200/50 px-2.5 py-1 text-xs font-bold text-surface-700 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                    {sector.sector_code}
                  </span>
                </div>
                <p className="text-sm font-semibold text-surface-600 line-clamp-1" title={sector.sector_name}>
                  {sector.sector_name}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-surface-400 mb-0.5">Tempo Médio</p>
                    <p className="text-2xl font-black text-surface-900 tracking-tight">
                      {sector.avg_hours_to_receive < 1
                        ? `${Math.round(sector.avg_hours_to_receive * 60)}m`
                        : `${sector.avg_hours_to_receive.toFixed(1)}h`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-0.5">Vol.</p>
                    <p className="text-sm font-bold text-surface-600">
                      {sector.total_received}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Activity & Overdue Protocols Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Activity */}
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] -z-0 opacity-50"></div>
          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 leading-tight">Atividade dos Usuários</h3>
              <p className="text-sm font-medium text-surface-500 mt-0.5">Ranking por número de ações realizadas</p>
            </div>
          </div>

          {userActivity && userActivity.length > 0 ? (
            <div className="relative z-10 space-y-2.5" style={{ height: 220, overflowY: 'auto' }}>
              {userActivity.map((user, index) => {
                const maxActions = userActivity[0]?.total_actions || 1;
                const pct = Math.round((user.total_actions / maxActions) * 100);
                return (
                  <div key={user.email} className="flex items-center gap-3 group">
                    <span className={cn(
                      'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0',
                      index === 0 ? 'bg-primary-500 text-white' :
                      index === 1 ? 'bg-primary-100 text-primary-700' :
                      index === 2 ? 'bg-primary-50 text-primary-600' :
                      'bg-surface-100 text-surface-500'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-surface-700 truncate" title={user.user_name}>
                          {user.user_name}
                        </p>
                        <span className="text-sm font-bold text-surface-900 ml-2 shrink-0">
                          {user.total_actions}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="Nenhuma atividade registrada" />
          )}
        </div>

        {/* Overdue Protocols */}
        <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger-50 rounded-bl-[100px] -z-0 opacity-50"></div>
          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-danger-50 text-danger-600">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 leading-tight">Protocolos Atrasados</h3>
              <p className="text-sm font-medium text-surface-500 mt-0.5">Protocolos que ultrapassaram o prazo de SLA</p>
            </div>
          </div>

          {overdueProtocols && overdueProtocols.length > 0 ? (
            <div className="relative z-10 space-y-2" style={{ height: 220, overflowY: 'auto' }}>
              {overdueProtocols.map((protocol) => {
                const deadline = new Date(protocol.deadlineAt);
                const now = new Date();
                const daysOverdue = Math.max(0, Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <div
                    key={protocol.id}
                    onClick={() => navigate(`/protocolos/${protocol.id}`)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-danger-100 bg-danger-50/30 p-3 hover:bg-danger-50/60 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-surface-900">{protocol.protocolNumber}</span>
                        <span className="inline-flex items-center rounded-md bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger-700">
                          {daysOverdue}d atraso
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-500 font-medium">
                        <span className="truncate" title={protocol.requestType?.name}>
                          {protocol.requestType?.name ?? '—'}
                        </span>
                        <span className="text-surface-300">|</span>
                        <span className="truncate" title={protocol.currentSector?.name}>
                          {protocol.currentSector?.name ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">Prazo</p>
                      <p className="text-sm font-semibold text-danger-600">
                        {deadline.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="Nenhum protocolo atrasado" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

// A fun little Pie icon since lucide-react doesn't have a perfect one standard maybe
function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'primary' | 'info' | 'success' | 'danger';
  highlight?: boolean;
}) {
  const colorMap = {
    primary: { 
      bg: 'bg-primary-500', 
      icon: 'text-white',
      glow: 'shadow-primary-500/20'
    },
    info: { 
      bg: 'bg-info-500', 
      icon: 'text-white',
      glow: 'shadow-info-500/20'
    },
    success: { 
      bg: 'bg-success-500', 
      icon: 'text-white',
      glow: 'shadow-success-500/20'
    },
    danger: { 
      bg: 'bg-danger-500', 
      icon: 'text-white',
      glow: 'shadow-danger-500/20'
    },
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-1',
        highlight 
          ? 'border-danger-300 ring-4 ring-danger-50 shadow-md shadow-danger-100' 
          : 'border-surface-200/60 shadow-sm hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold uppercase tracking-wider text-surface-500 line-clamp-1">{label}</p>
          <p className="text-3xl font-black text-surface-900 mt-1 sm:mt-2 tracking-tight">{value}</p>
        </div>
        <div className={cn('rounded-xl p-3 shrink-0 shadow-lg', colorMap[color].bg, colorMap[color].glow)}>
          <Icon className={cn('h-6 w-6', colorMap[color].icon)} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center relative z-10 bg-surface-50/50 rounded-xl border border-dashed border-surface-200 mt-4">
      <div className="h-12 w-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
        <FileText className="h-6 w-6 text-surface-400" />
      </div>
      <p className="text-surface-500 font-medium text-sm">{text}</p>
    </div>
  );
}
