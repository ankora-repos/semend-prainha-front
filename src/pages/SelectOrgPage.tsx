import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { api } from '@/api/client';
import { extractErrorMessage } from '@/lib/errors';
import { Loader2, Building2, ArrowRight, Search } from 'lucide-react';
import type { Organization } from '@/contexts/OrganizationContext';

export function SelectOrgPage() {
  const { setSlug } = useOrganization();
  const navigate = useNavigate();
  const [inputSlug, setInputSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSlug.trim().toLowerCase();
    if (!trimmed) {
      setError('Informe o codigo da organizacao');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.get<Organization>(`/organizations/public/${trimmed}`);
      if (res.data) {
        setSlug(trimmed);
        navigate('/login');
      }
    } catch (err) {
      setError(extractErrorMessage(err) || 'Organizacao nao encontrada. Verifique o codigo informado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel -- Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Sistema de Protocolo</h2>
              <p className="text-primary-200 text-sm">Multi-Organizacional</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestao de Protocolos e Tramitacao
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Identifique sua organizacao para acessar o sistema de protocolo
            com total seguranca e rastreabilidade.
          </p>
        </div>
      </div>

      {/* Right Panel -- Slug Input */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-surface-900 font-semibold">Sistema de Protocolo</h2>
              <p className="text-surface-500 text-xs">Multi-Organizacional</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">Identificar organizacao</h1>
            <p className="text-surface-500 mt-2">
              Informe o codigo da sua organizacao para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-surface-700 mb-1.5">
                Codigo da organizacao
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                  id="slug"
                  type="text"
                  value={inputSlug}
                  onChange={(e) => setInputSlug(e.target.value)}
                  placeholder="ex: minha-organizacao"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-surface-400 mt-1.5">
                O codigo foi fornecido pelo administrador da sua organizacao
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/consulta"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Search className="h-4 w-4" />
                Consultar andamento de protocolo
              </Link>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-surface-400">
            Sistema de Gestao de Protocolos
          </p>
        </div>
      </div>
    </div>
  );
}
