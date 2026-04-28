import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '@/api/auth.api';
import { setAccessToken } from '@/api/client';
import type { AuthUser, Permissions } from '@/types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: keyof Permissions) => boolean;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .refresh()
      .then(() => authApi.me())
      .then(setUser)
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authApi.login({ email, password });
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setUser(null);
    setAccessToken(null);
  }, []);

  const can = useCallback(
    (permission: keyof Permissions): boolean => {
      if (!user) return false;
      if (user.role.isSuperadmin) return true;
      return user.role.permissions[permission] === true;
    },
    [user],
  );

  const isSuperadmin = user?.role.isSuperadmin ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        can,
        isSuperadmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
