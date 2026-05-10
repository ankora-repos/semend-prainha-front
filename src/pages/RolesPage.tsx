import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/api/roles.api';
import type { CreateRoleDto } from '@/api/roles.api';
import type { Role } from '@/types/auth.types';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldCheck, Check, X, Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERM_LABELS: Record<string, string> = {
  view: 'Visualizar',
  edit: 'Editar',
  send: 'Enviar',
  receive: 'Receber',
  approve: 'Aprovar',
  reject: 'Rejeitar',
};

const PERM_KEYS = ['view', 'edit', 'send', 'receive', 'approve', 'reject'] as const;

const INPUT_CLASS =
  'w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300 placeholder:text-surface-400';

const LABEL_CLASS = 'block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5';

const DEFAULT_PERMISSIONS = { view: false, edit: false, send: false, receive: false, approve: false, reject: false };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function RolesPage() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list() });

  // ── Create state ───────────────────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRoleDto>({
    name: '', slug: '', permissions: { ...DEFAULT_PERMISSIONS },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleDto) => rolesApi.create(data),
    onSuccess: () => {
      toast.success('Perfil criado com sucesso!');
      setShowCreateForm(false);
      setCreateForm({ name: '', slug: '', permissions: { ...DEFAULT_PERMISSIONS } });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState<CreateRoleDto>({
    name: '', slug: '', permissions: { ...DEFAULT_PERMISSIONS },
  });

  function openEdit(role: Role) {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      slug: role.slug,
      permissions: { ...role.permissions },
    });
  }

  function closeEdit() {
    setEditingRole(null);
    setEditForm({ name: '', slug: '', permissions: { ...DEFAULT_PERMISSIONS } });
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRoleDto }) => rolesApi.update(id, data),
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      closeEdit();
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    updateMutation.mutate({ id: editingRole.id, data: editForm });
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Perfis de Acesso</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">Gerencie os perfis e permissões do sistema ({roles?.length ?? 0})</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Novo Perfil
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando perfis...</p>
        </div>
      ) : !roles?.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum perfil cadastrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px]">Entre em contato com o suporte para configurar os perfis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles?.map((r) => (
            <div key={r.id} className="group flex flex-col rounded-2xl border border-surface-200/60 bg-white p-6 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105",
                  "bg-gradient-to-br from-primary-50 to-indigo-50 text-primary-600 ring-primary-100/50"
                )}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="pt-0.5 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-surface-900 leading-tight">{r.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Editar perfil"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-surface-400 font-mono tracking-tight bg-surface-50 px-1.5 py-0.5 rounded border border-surface-100">
                    {r.slug}
                  </span>
                </div>
              </div>
              
              <div className="mt-auto pt-5 border-t border-surface-100/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-3">Permissões Específicas</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(r.permissions).map(([key, isAllowed]) => (
                    <span 
                      key={key} 
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors",
                        isAllowed 
                          ? "border-success-200/60 bg-success-50/50 text-success-700" 
                          : "border-surface-200/60 bg-surface-50/50 text-surface-400"
                      )}
                    >
                      {isAllowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
                      <span className={!isAllowed ? "line-through opacity-70" : ""}>
                        {PERM_LABELS[key] ?? key}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ───────────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight">Novo Perfil</h3>
                <p className="text-sm text-surface-500 font-medium mt-1">Defina o nome e as permissões do perfil.</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors -mt-4 -mr-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  ...createForm,
                  slug: createForm.slug || slugify(createForm.name),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className={LABEL_CLASS}>Nome do Perfil</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coordenador"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value, slug: slugify(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Slug</label>
                <input
                  type="text"
                  required
                  placeholder="coordenador"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Permissões</label>
                <div className="space-y-2 mt-2">
                  {PERM_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 cursor-pointer hover:border-surface-300 transition-all"
                    >
                      <span className="text-sm font-medium text-surface-900">{PERM_LABELS[key]}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={createForm.permissions[key]}
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            permissions: { ...createForm.permissions, [key]: !createForm.permissions[key] },
                          })
                        }
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                          createForm.permissions[key] ? 'bg-primary-600' : 'bg-surface-300',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                            createForm.permissions[key] ? 'translate-x-[22px]' : 'translate-x-[3px]',
                          )}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" onClick={closeEdit} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight">Editar Perfil</h3>
                <p className="text-sm text-surface-500 font-medium mt-1">
                  Atualize os dados de <span className="font-bold text-surface-700">{editingRole.name}</span>
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors -mt-4 -mr-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Nome do Perfil</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coordenador"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Slug</label>
                <input
                  type="text"
                  required
                  placeholder="coordenador"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Permissões</label>
                <div className="space-y-2 mt-2">
                  {PERM_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 cursor-pointer hover:border-surface-300 transition-all"
                    >
                      <span className="text-sm font-medium text-surface-900">{PERM_LABELS[key]}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editForm.permissions[key]}
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            permissions: { ...editForm.permissions, [key]: !editForm.permissions[key] },
                          })
                        }
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                          editForm.permissions[key] ? 'bg-primary-600' : 'bg-surface-300',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                            editForm.permissions[key] ? 'translate-x-[22px]' : 'translate-x-[3px]',
                          )}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
