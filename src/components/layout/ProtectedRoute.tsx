import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Permissions } from '@/types/auth.types';
import { Loader2 } from 'lucide-react';

interface Props {
  requiredPermission?: keyof Permissions;
}

export function ProtectedRoute({ requiredPermission }: Props) {
  const { isAuthenticated, isLoading, can } = useAuth();

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

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
