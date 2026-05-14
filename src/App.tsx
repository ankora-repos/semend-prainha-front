import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { SuperAdminRoute } from '@/components/layout/SuperAdminRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
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
import { MyAccountPage } from '@/pages/MyAccountPage';
import { PublicLookupPage } from '@/pages/PublicLookupPage';
import { AdminOrganizationsPage } from '@/pages/admin/AdminOrganizationsPage';
import { SuperAdminsPage } from '@/pages/admin/SuperAdminsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
        <OrganizationProvider>
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
              <Route path="/selecionar-organizacao" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
              <Route path="/consulta" element={<PublicLookupPage />} />

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
                  <Route path="/minha-conta" element={<MyAccountPage />} />
                  <Route element={<SuperAdminRoute />}>
                    <Route path="/admin/organizacoes" element={<AdminOrganizationsPage />} />
                    <Route path="/admin/superadmins" element={<SuperAdminsPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </OrganizationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
