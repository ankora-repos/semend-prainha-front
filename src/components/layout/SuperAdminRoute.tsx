import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Route guard that only allows superadmin users.
 * Redirects non-superadmin users to the dashboard.
 */
export function SuperAdminRoute() {
  const { isAuthenticated, isLoading, isSuperadmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="text-sm text-surface-500">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
