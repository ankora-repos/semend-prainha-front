import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { sectorsApi } from '@/api/sectors.api';
import { rolesApi } from '@/api/roles.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

import { Plus, Loader2, Users as UsersIcon, X, Search } from 'lucide-react';
import type { CreateUserDto } from '@/types/user.types';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => sectorsApi.list() });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list() });

  const [form, setForm] = useState<CreateUserDto>({
    name: '', email: '', password: '', registrationNumber: '', sectorId: '', roleId: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: () => {
      toast.success('Usuário criado!');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', registrationNumber: '', sectorId: '', roleId: '' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      toast.success('Usuário desativado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const filtered = users?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Usuários</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">{users?.length ?? 0} perfis cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full rounded-xl border border-surface-200/80 bg-white pl-10 pr-4 py-3 text-sm font-medium text-surface-900 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300 shadow-xs placeholder:text-surface-400"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando usuários...</p>
        </div>
      ) : !filtered?.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <UsersIcon className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum usuário encontrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px]">Adicione um novo usuário ou ajuste os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((u) => (
            <div key={u.id} className="group flex flex-col rounded-2xl border border-surface-200/60 bg-white p-5 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 text-primary-700 ring-1 ring-primary-100 shadow-sm">
                  <span className="text-sm font-bold tracking-wider">{u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</span>
                </div>
                <button
                  onClick={() => { if (confirm(`Desativar ${u.name}?`)) deleteMutation.mutate(u.id); }}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Desativar usuário"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-base font-bold text-surface-900 line-clamp-1" title={u.name}>{u.name}</p>
              <p className="text-sm font-medium text-surface-500 mt-0.5 line-clamp-1" title={u.email}>{u.email}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-bold text-surface-700">
                  {u.role?.name ?? '-'}
                </span>
                <span className="inline-flex items-center rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 ring-1 ring-primary-100">
                  {u.sector?.name ?? '-'}
                </span>
              </div>
              
              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                  <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">Matrícula</span>
                  <span className="text-xs font-bold text-surface-700">{u.registrationNumber}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight">Novo Usuário</h3>
                <p className="text-sm text-surface-500 font-medium mt-1">Preencha os dados para criar um acesso.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors -mt-4 -mr-2"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              {[
                { key: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Ex: Maria Silva' },
                { key: 'email', label: 'E-mail Corporativo', type: 'email', placeholder: 'email@semed.prainha.pa.gov.br' },
                { key: 'password', label: 'Senha de Acesso', type: 'password', placeholder: 'Mínimo 8 caracteres' },
                { key: 'registrationNumber', label: 'Matrícula', type: 'text', placeholder: '000000' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">{field.label}</label>
                  <input
                    type={field.type} required placeholder={field.placeholder}
                    value={(form as unknown as Record<string, string>)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300 placeholder:text-surface-400"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Setor</label>
                  <select required value={form.sectorId} onChange={(e) => setForm({ ...form, sectorId: e.target.value })} className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300">
                    <option value="">Selecione</option>
                    {sectors?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Perfil</label>
                  <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300">
                    <option value="">Selecione</option>
                    {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
