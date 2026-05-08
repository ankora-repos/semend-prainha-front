import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/api/users.api';
import { toast } from 'sonner';
import { User, Mail, KeyRound, Save, Loader2, Shield, Building2, Hash } from 'lucide-react';

export function MyAccountPage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error('O nome não pode ficar vazio');

    setSavingProfile(true);
    try {
      await usersApi.update(user.id, { name: name.trim(), email: email.trim() });
      await refreshUser();
      toast.success('Dados atualizados com sucesso');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar dados');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) return toast.error('A nova senha deve ter no mínimo 8 caracteres');
    if (newPassword !== confirmPassword) return toast.error('As senhas não coincidem');

    setSavingPassword(true);
    try {
      await usersApi.update(user.id, { password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Minha Conta</h1>
        <p className="text-surface-500 text-sm mt-1.5 font-medium">Gerencie seus dados pessoais e senha de acesso</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500">Perfil</p>
            <p className="text-sm font-bold text-surface-900">{user.role?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500">Setor</p>
            <p className="text-sm font-bold text-surface-900">{user.sector?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500">Matrícula</p>
            <p className="text-sm font-bold text-surface-900">{user.registrationNumber}</p>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl border border-surface-200/60 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Dados Pessoais</h2>
              <p className="text-sm text-surface-500">Atualize seu nome e e-mail de acesso</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-50/50 border-t border-surface-100 flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </button>
        </div>
      </form>

      {/* Alterar senha */}
      <form onSubmit={handleChangePassword} className="rounded-2xl border border-surface-200/60 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Alterar Senha</h2>
              <p className="text-sm text-surface-500">Defina uma nova senha de acesso ao sistema</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-4 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-4 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-50/50 border-t border-surface-100 flex justify-end">
          <button
            type="submit"
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Alterar senha
          </button>
        </div>
      </form>
    </div>
  );
}
