import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { NewRequestPage } from '@/pages/NewRequestPage';
import { RequestDetailPage } from '@/pages/RequestDetailPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SectorsPage } from '@/pages/SectorsPage';
import { RolesPage } from '@/pages/RolesPage';
import { RequestTypesPage } from '@/pages/RequestTypesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/protocolos" element={<RequestsPage />} />
                <Route path="/protocolos/novo" element={<NewRequestPage />} />
                <Route path="/protocolos/:id" element={<RequestDetailPage />} />
                <Route path="/notificacoes" element={<NotificationsPage />} />
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/setores" element={<SectorsPage />} />
                <Route path="/perfis" element={<RolesPage />} />
                <Route path="/tipos-solicitacao" element={<RequestTypesPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/auditoria" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
