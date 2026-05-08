import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/lib/errors';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-lg">
              SP
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">SEMED Prainha</h2>
              <p className="text-primary-200 text-sm">Sistema de Protocolo</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestão de Protocolos e Tramitação
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Controle completo do ciclo de vida dos seus documentos, 
            da abertura à conclusão, com rastreabilidade total.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Rastreabilidade', value: 'Completa' },
              { label: 'Controle de SLA', value: 'Automático' },
              { label: 'Notificações', value: 'Em tempo real' },
              { label: 'Auditoria', value: '100% registrada' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-primary-200 text-xs font-medium">{stat.label}</p>
                <p className="text-white font-semibold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
              SP
            </div>
            <div>
              <h2 className="text-surface-900 font-semibold">SEMED Prainha</h2>
              <p className="text-surface-500 text-xs">Sistema de Protocolo</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">Entrar no sistema</h1>
            <p className="text-surface-500 mt-2">Informe suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@semed.prainha.pa.gov.br"
                required
                autoFocus
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 pr-11 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>

            <div className="text-center space-y-2">
              <Link
                to="/esqueci-senha"
                className="block text-sm text-surface-500 hover:text-primary-600 transition-colors"
              >
                Esqueceu sua senha?
              </Link>
              <Link
                to="/consulta"
                className="block text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Consultar andamento de protocolo
              </Link>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-surface-400">
            Secretaria Municipal de Educação de Prainha - PA
          </p>
        </div>
      </div>
    </div>
  );
}
