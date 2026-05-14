import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { extractErrorMessage } from '@/lib/errors';

type State = 'idle' | 'loading' | 'success' | 'error';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  function startCountdown() {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setState('loading');

    try {
      await authApi.forgotPassword(email);
      setState('success');
      startCountdown();
    } catch (err) {
      setError(extractErrorMessage(err));
      setState('error');
    }
  }

  const isDisabled = state === 'loading' || (state === 'success' && countdown > 0);

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
              Pr
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Protocolla</h2>
              <p className="text-primary-200 text-sm">Gestão de Protocolos</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Recuperação de Acesso
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Enviaremos um link seguro para o seu e-mail cadastrado. O link expira em 1 hora.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
              Pr
            </div>
            <div>
              <h2 className="text-surface-900 font-semibold">Protocolla</h2>
              <p className="text-surface-500 text-xs">Gestão de Protocolos</p>
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
            <h1 className="text-2xl font-bold text-surface-900">Esqueceu sua senha?</h1>
            <p className="text-surface-500 mt-2">
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {state === 'success' ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-800 mb-1">Link enviado!</p>
              <p className="text-sm text-green-700">
                Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes.
              </p>
              {countdown > 0 && (
                <p className="text-xs text-green-600 mt-4">
                  Reenviar disponível em{' '}
                  <span className="font-semibold">{countdown}s</span>
                </p>
              )}
              {countdown === 0 && (
                <button
                  onClick={() => setState('idle')}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Tentar com outro e-mail
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {state === 'error' && (
                <div className="rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@semed.prainha.pa.gov.br"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {state === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-surface-400">
            Protocolla &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
