import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminsApi, type SuperAdminUser } from '@/api/superadmins.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, Loader2, UserMinus, UserPlus, X, Search,
} from 'lucide-react';
import { api } from '@/api/client';

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  isSuperadmin: boolean;
  organization: { name: string; slug: string };
  role: { name: string };
}

export function SuperAdminsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const { data: superadmins, isLoading } = useQuery({
    queryKey: ['superadmins'],
    queryFn: superAdminsApi.list,
  });

  const demoteMutation = useMutation({
    mutationFn: (userId: string) => superAdminsApi.demote(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['superadmins'] });
      toast.success(data.message);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: string) => superAdminsApi.promote(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['superadmins'] });
      toast.success(data.message);
      setShowAddModal(false);
      setSearchEmail('');
      setSearchResults([]);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const res = await api.get<UserSearchResult[]>('/superadmins/search-users', {
        params: { q: searchEmail.trim() },
      });
      const users = res.data;
      setSearchResults(users);
      if (users.length === 0) {
        setSearchError('Nenhum usuário encontrado com esse e-mail');
      }
    } catch (err) {
      setSearchError(extractErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Super Administradores</h1>
          <p className="text-sm text-surface-500 mt-1">
            Gerencie quem tem acesso total ao sistema
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setSearchEmail('');
            setSearchResults([]);
            setSearchError('');
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar Super Admin
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Super Admin List */}
      {superadmins && superadmins.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-200/60 shadow-xs overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-surface-400">
                  Usuário
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-surface-400 hidden sm:table-cell">
                  Organização
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-surface-400 hidden md:table-cell">
                  Perfil
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-surface-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {superadmins.map((sa) => (
                <tr key={sa.id} className="hover:bg-surface-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-sm shrink-0">
                        {sa.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">{sa.name}</p>
                        <p className="text-xs text-surface-500 truncate">{sa.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-surface-700">{sa.organization.name}</span>
                    <span className="text-xs text-surface-400 ml-1 font-mono">({sa.organization.slug})</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <ShieldCheck className="h-3 w-3" />
                      {sa.role.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover super admin de "${sa.name}"?`)) {
                          demoteMutation.mutate(sa.id);
                        }
                      }}
                      disabled={demoteMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                      title="Remover super admin"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Remover</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty */}
      {superadmins && superadmins.length === 0 && (
        <div className="text-center py-16">
          <ShieldCheck className="h-12 w-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 text-sm">Nenhum super administrador encontrado</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-surface-200/60 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900">Adicionar Super Admin</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="searchEmail" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Buscar usuário por nome ou e-mail
                </label>
                <div className="flex gap-2">
                  <input
                    id="searchEmail"
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="nome ou email do usuário"
                    className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchEmail.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-surface-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-surface-700 disabled:opacity-50 transition-all"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </button>
                </div>
              </div>

              {searchError && (
                <p className="text-sm text-danger-600">{searchError}</p>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-surface-200 rounded-lg divide-y divide-surface-100 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.name}</p>
                        <p className="text-xs text-surface-500 truncate">{user.email}</p>
                        <p className="text-xs text-surface-400 truncate">{user.organization.name}</p>
                      </div>
                      {user.isSuperadmin ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 shrink-0">
                          <ShieldCheck className="h-3 w-3" />
                          Já é super admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => promoteMutation.mutate(user.id)}
                          disabled={promoteMutation.isPending}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shrink-0',
                            promoteMutation.isPending && 'opacity-50',
                          )}
                        >
                          {promoteMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5" />
                          )}
                          Promover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
