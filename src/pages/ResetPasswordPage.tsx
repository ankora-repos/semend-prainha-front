import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { extractErrorMessage } from '@/lib/errors';

type State = 'no-token' | 'idle' | 'loading' | 'success' | 'error';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setState('no-token');
    }
  }, [token]);

  useEffect(() => {
    if (state !== 'success') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setState('loading');

    try {
      await authApi.resetPassword(token!, newPassword);
      setState('success');
    } catch (err) {
      setError(extractErrorMessage(err));
      setState('error');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
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
            Redefinição de Senha
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Escolha uma senha segura com no mínimo 8 caracteres para proteger sua conta.
          </p>
        </div>
      </div>

      {/* Right Panel */}
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

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">Redefinir senha</h1>
            <p className="text-surface-500 mt-2">Digite sua nova senha abaixo.</p>
          </div>

          {/* Estado: sem token */}
          {state === 'no-token' && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
              <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-800 mb-1">Link inválido</p>
              <p className="text-sm text-red-700 mb-4">
                Este link de recuperação é inválido ou está incompleto.
              </p>
              <Link
                to="/esqueci-senha"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Solicitar nova recuperação
              </Link>
            </div>
          )}

          {/* Estado: sucesso */}
          {state === 'success' && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-800 mb-1">Senha redefinida!</p>
              <p className="text-sm text-green-700 mb-4">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login em{' '}
                <span className="font-semibold">{countdown}s</span>.
              </p>
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ir para o login agora
              </Link>
            </div>
          )}

          {/* Formulário */}
          {(state === 'idle' || state === 'loading' || state === 'error') && token && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {state === 'error' && (
                <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                  {error}{' '}
                  {error.toLowerCase().includes('expirado') && (
                    <Link to="/esqueci-senha" className="underline font-medium">
                      Solicitar novo link
                    </Link>
                  )}
                </div>
              )}

              {/* Senha inline error (não de servidor) */}
              {state !== 'error' && error && (
                <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    autoFocus
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 pr-11 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={state === 'loading'}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {state === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-surface-400">
            Secretaria Municipal de Educação de Prainha - PA
          </p>
        </div>
      </div>
    </div>
  );
}
