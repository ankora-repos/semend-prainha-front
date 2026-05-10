import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, type OrganizationListItem, type CreateOrganizationDto, type OrgAnalytics } from '@/api/organizations.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Building2, Plus, Loader2, X, Users, FileText,
  CheckCircle, XCircle, Pencil, Power, TrendingUp,
  AlertTriangle, Activity, Globe,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

type ModalMode = 'closed' | 'create' | 'edit';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  BASIC: 'Básico',
  PRO: 'Profissional',
  ENTERPRISE: 'Empresarial',
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-surface-100 text-surface-600',
  BASIC: 'bg-blue-50 text-blue-700',
  PRO: 'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-amber-50 text-amber-700',
};

const PIE_COLORS: Record<string, string> = {
  FREE: '#94a3b8',
  BASIC: '#3b82f6',
  PRO: '#8b5cf6',
  ENTERPRISE: '#f59e0b',
};

export function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>('closed');
  const [editingOrg, setEditingOrg] = useState<OrganizationListItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('');
  const [formPlan, setFormPlan] = useState('FREE');
  const [formError, setFormError] = useState('');

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const { data: analytics } = useQuery({
    queryKey: ['organizations', 'analytics'],
    queryFn: organizationsApi.analytics,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organização criada com sucesso!');
      closeModal();
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string; plan?: string } }) =>
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organização atualizada!');
      closeModal();
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => organizationsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organização desativada!');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function openCreate() {
    setFormName('');
    setFormSlug('');
    setFormAdminName('');
    setFormAdminEmail('');
    setFormAdminPassword('');
    setFormPlan('FREE');
    setFormError('');
    setEditingOrg(null);
    setModalMode('create');
  }

  function openEdit(org: OrganizationListItem) {
    setFormName(org.name);
    setFormSlug(org.slug);
    setFormPlan(org.plan);
    setFormAdminName('');
    setFormAdminEmail('');
    setFormAdminPassword('');
    setFormError('');
    setEditingOrg(org);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode('closed');
    setEditingOrg(null);
    setFormError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (modalMode === 'create') {
      createMutation.mutate({
        name: formName,
        slug: formSlug,
        adminName: formAdminName,
        adminEmail: formAdminEmail,
        adminPassword: formAdminPassword,
        plan: formPlan,
      });
    } else if (modalMode === 'edit' && editingOrg) {
      updateMutation.mutate({
        id: editingOrg.id,
        data: { name: formName, slug: formSlug, plan: formPlan },
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Painel de Organizações</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">
            Visão geral e gestão de todas as organizações da plataforma
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Nova Organização
        </button>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={Globe} label="Organizações" value={analytics.totals.organizations} sub={`${analytics.totals.activeOrganizations} ativas`} color="primary" />
            <StatCard icon={Users} label="Usuários" value={analytics.totals.totalUsers} color="info" />
            <StatCard icon={FileText} label="Protocolos" value={analytics.totals.totalRequests} color="success" />
            <StatCard icon={AlertTriangle} label="Atrasados" value={analytics.totals.totalOverdue} color="danger" highlight={analytics.totals.totalOverdue > 0} />
            <StatCard icon={Activity} label="Logins (30d)" value={analytics.perOrg.reduce((s, o) => s + o.loginsLast30d, 0)} color="amber" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Protocols per Org */}
            <div className="lg:col-span-2 rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-surface-900">Protocolos por Organização</h3>
              </div>
              {analytics.perOrg.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.perOrg} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '13px', fontWeight: 500, padding: '8px 12px' }} />
                      <Bar dataKey="totalRequests" name="Protocolos" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      <Bar dataKey="overdueRequests" name="Atrasados" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyChart />}
            </div>

            {/* Plan Distribution */}
            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-surface-900">Distribuição por Plano</h3>
              </div>
              {analytics.planDistribution.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.planDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="plan"
                          stroke="transparent"
                          cornerRadius={6}
                        >
                          {analytics.planDistribution.map((entry) => (
                            <Cell key={entry.plan} fill={PIE_COLORS[entry.plan] ?? '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, _: any, props: any) => [`${v}`, PLAN_LABELS[props.payload.plan] ?? props.payload.plan]} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 500 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-2">
                    {analytics.planDistribution.map((item) => (
                      <div key={item.plan} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[item.plan] ?? '#94a3b8' }} />
                          <span className="text-xs font-semibold text-surface-600">{PLAN_LABELS[item.plan] ?? item.plan}</span>
                        </div>
                        <span className="text-xs font-bold text-surface-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyChart />}
            </div>
          </div>

          {/* Growth Chart */}
          {analytics.protocolsByMonth.length > 0 && (
            <div className="rounded-2xl border border-surface-200/60 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-success-50 text-success-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-surface-900 leading-tight">Crescimento da Plataforma</h3>
                  <p className="text-xs text-surface-500 font-medium mt-0.5">Protocolos criados por mês (últimos 6 meses)</p>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.protocolsByMonth} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => { const [y, m] = v.split('-'); const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`; }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => { const [y, m] = v.split('-'); const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']; return `${months[parseInt(m, 10) - 1]} de ${y}`; }} formatter={(v: any) => [`${v}`, 'Protocolos']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 500, padding: '8px 12px' }} />
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Org Details Table */}
          <div className="rounded-2xl border border-surface-200/60 bg-white shadow-xs overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-surface-100">
              <h3 className="text-sm font-bold text-surface-900">Detalhamento por Organização</h3>
              <p className="text-xs text-surface-500 font-medium mt-0.5">Métricas completas de cada organização</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50/50">
                    <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Organização</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Plano</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Usuários</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Protocolos</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Setores</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Atrasados</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Logins (30d)</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider text-surface-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {analytics.perOrg.map((org) => (
                    <tr key={org.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-surface-900">{org.name}</p>
                        <p className="text-xs text-surface-400 font-mono">{org.slug}</p>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold', PLAN_COLORS[org.plan] || PLAN_COLORS.FREE)}>
                          {PLAN_LABELS[org.plan] || org.plan}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 font-semibold text-surface-700">{org.totalUsers}</td>
                      <td className="text-center px-3 py-3 font-semibold text-surface-700">{org.totalRequests}</td>
                      <td className="text-center px-3 py-3 font-semibold text-surface-700">{org.totalSectors}</td>
                      <td className="text-center px-3 py-3">
                        <span className={cn('font-bold', org.overdueRequests > 0 ? 'text-danger-600' : 'text-surface-400')}>
                          {org.overdueRequests}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={cn('font-semibold', org.loginsLast30d > 0 ? 'text-surface-700' : 'text-surface-300')}>
                          {org.loginsLast30d}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                          org.isActive ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-600',
                        )}>
                          {org.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {org.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando dados...</p>
        </div>
      )}

      {/* Org Cards */}
      {orgs && orgs.length > 0 && (
        <>
          <div className="border-t border-surface-200/60 pt-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Gerenciar Organizações</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgs.map((org) => (
              <div
                key={org.id}
                className={cn(
                  'rounded-xl border bg-white shadow-xs p-5 transition-all hover:shadow-sm',
                  org.isActive ? 'border-surface-200/60' : 'border-danger-200 bg-danger-50/30',
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: org.primaryColor || '#6366f1' }}
                    >
                      {org.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-surface-900 truncate">{org.name}</h3>
                      <p className="text-xs text-surface-500 font-mono">{org.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(org)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {org.isActive && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Desativar a organização "${org.name}"?`)) {
                            deactivateMutation.mutate(org.id);
                          }
                        }}
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                        title="Desativar"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', PLAN_COLORS[org.plan] || PLAN_COLORS.FREE)}>
                    {PLAN_LABELS[org.plan] || org.plan}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
                    org.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-danger-50 text-danger-600',
                  )}>
                    {org.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {org.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {/* Counts */}
                {org._count && (
                  <div className="flex gap-4 text-xs text-surface-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {org._count.users} usuários
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {org._count.requests} protocolos
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {orgs && orgs.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 text-sm">Nenhuma organização cadastrada</p>
        </div>
      )}

      {/* Modal */}
      {modalMode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-surface-200/60 p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900">
                {modalMode === 'create' ? 'Nova Organização' : 'Editar Organização'}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-surface-700 mb-1.5">Nome</label>
                <input id="orgName" type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: SEMED Prainha" required className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
              </div>

              <div>
                <label htmlFor="orgSlug" className="block text-sm font-medium text-surface-700 mb-1.5">Slug (código)</label>
                <input id="orgSlug" type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="ex: semed-prainha" required className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono" />
              </div>

              {modalMode === 'create' && (
                <>
                  <div>
                    <label htmlFor="adminName" className="block text-sm font-medium text-surface-700 mb-1.5">Nome do administrador</label>
                    <input id="adminName" type="text" value={formAdminName} onChange={(e) => setFormAdminName(e.target.value)} placeholder="Nome completo" required className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-medium text-surface-700 mb-1.5">E-mail do administrador</label>
                    <input id="adminEmail" type="email" value={formAdminEmail} onChange={(e) => setFormAdminEmail(e.target.value)} placeholder="admin@organizacao.com" required className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-surface-700 mb-1.5">Senha do administrador</label>
                    <input id="adminPassword" type="password" value={formAdminPassword} onChange={(e) => setFormAdminPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-surface-700 mb-1.5">Plano</label>
                <select id="plan" value={formPlan} onChange={(e) => setFormPlan(e.target.value)} className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all">
                  <option value="FREE">Gratuito</option>
                  <option value="BASIC">Básico</option>
                  <option value="PRO">Profissional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Criar Organização' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, sub, color, highlight }: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  color: 'primary' | 'info' | 'success' | 'danger' | 'amber';
  highlight?: boolean;
}) {
  const styles = {
    primary: { bg: 'bg-primary-500', glow: 'shadow-primary-500/20' },
    info:    { bg: 'bg-info-500',    glow: 'shadow-info-500/20' },
    success: { bg: 'bg-success-500', glow: 'shadow-success-500/20' },
    danger:  { bg: 'bg-danger-500',  glow: 'shadow-danger-500/20' },
    amber:   { bg: 'bg-amber-500',   glow: 'shadow-amber-500/20' },
  };
  const s = styles[color];

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5',
      highlight ? 'border-danger-300 ring-4 ring-danger-50 shadow-md shadow-danger-100' : 'border-surface-200/60 shadow-sm hover:shadow-md',
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 line-clamp-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-surface-900 mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-[11px] font-medium text-surface-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5 shrink-0 shadow-lg', s.bg, s.glow)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[200px] text-surface-400 text-sm font-medium">
      Nenhum dado disponível
    </div>
  );
}
