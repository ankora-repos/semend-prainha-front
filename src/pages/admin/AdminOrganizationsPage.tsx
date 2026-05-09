import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, type OrganizationListItem, type CreateOrganizationDto } from '@/api/organizations.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Building2, Plus, Loader2, X, Users, FileText,
  CheckCircle, XCircle, Pencil, Power,
} from 'lucide-react';

type ModalMode = 'closed' | 'create' | 'edit';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  BASIC: 'Basico',
  PRO: 'Profissional',
  ENTERPRISE: 'Empresarial',
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-surface-100 text-surface-600',
  BASIC: 'bg-blue-50 text-blue-700',
  PRO: 'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-amber-50 text-amber-700',
};

export function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>('closed');
  const [editingOrg, setEditingOrg] = useState<OrganizationListItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('');
  const [formPlan, setFormPlan] = useState('FREE');
  const [formError, setFormError] = useState('');

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organizacao criada com sucesso!');
      closeModal();
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string; plan?: string } }) =>
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organizacao atualizada!');
      closeModal();
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => organizationsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organizacao desativada!');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function openCreate() {
    setFormName('');
    setFormSlug('');
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Organizacoes</h1>
          <p className="text-sm text-surface-500 mt-1">
            Gerencie as organizacoes do sistema
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nova Organizacao
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Org Cards */}
      {orgs && (
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
                        if (window.confirm(`Desativar a organizacao "${org.name}"?`)) {
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
                    {org._count.users} usuarios
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
      )}

      {/* Empty State */}
      {orgs && orgs.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 text-sm">Nenhuma organizacao cadastrada</p>
        </div>
      )}

      {/* Modal */}
      {modalMode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-surface-200/60 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900">
                {modalMode === 'create' ? 'Nova Organizacao' : 'Editar Organizacao'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              >
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
                <label htmlFor="orgName" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Nome
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: SEMED Prainha"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="orgSlug" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Slug (codigo)
                </label>
                <input
                  id="orgSlug"
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ex: semed-prainha"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono"
                />
              </div>

              {modalMode === 'create' && (
                <>
                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-medium text-surface-700 mb-1.5">
                      E-mail do administrador
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      value={formAdminEmail}
                      onChange={(e) => setFormAdminEmail(e.target.value)}
                      placeholder="admin@organizacao.com"
                      required
                      className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-surface-700 mb-1.5">
                      Senha do administrador
                    </label>
                    <input
                      id="adminPassword"
                      type="password"
                      value={formAdminPassword}
                      onChange={(e) => setFormAdminPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Plano
                </label>
                <select
                  id="plan"
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                >
                  <option value="FREE">Gratuito</option>
                  <option value="BASIC">Basico</option>
                  <option value="PRO">Profissional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Criar organizacao' : 'Salvar alteracoes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
