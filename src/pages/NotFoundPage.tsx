import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Página não encontrada</h1>
        <p className="text-surface-500 mb-8">A página que você está procurando não existe ou foi movida.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm"
          >
            <Home className="h-4 w-4" />
            Ir para o início
          </button>
        </div>
      </div>
    </div>
  );
}
