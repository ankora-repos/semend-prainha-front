# Guia Completo — Frontend consumindo a API do Sistema de Protocolo e Tramitação

---

## 1. Stack Recomendada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | **React 18+ com Vite** | CORS já configurado para `localhost:5173` |
| Linguagem | **TypeScript (strict)** | Tipagem end-to-end com os DTOs da API |
| HTTP Client | **Axios** | Interceptors nativos para JWT refresh |
| Estado Global | **TanStack Query (React Query v5)** | Cache automático, revalidação, loading/error states |
| Formulários | **React Hook Form + Zod** | Validação client-side espelhando os DTOs |
| Roteamento | **React Router v6** | Rotas protegidas com guard de autenticação |
| UI | **Tailwind CSS + shadcn/ui** | Componentes acessíveis, rápido de montar |
| Gráficos | **Recharts** | Dashboard com gráficos nativos React |
| Testes | **Vitest + Testing Library + MSW** | Testes unitários + integração com mock de API |

---

## 2. Estrutura de Pastas

```
src/
├── api/
│   ├── client.ts              # Axios instance + interceptors
│   ├── auth.api.ts            # login, refresh, logout, me
│   ├── requests.api.ts        # protocolos CRUD
│   ├── tramitations.api.ts    # forward, receive, changeStatus
│   ├── sectors.api.ts         # setores
│   ├── users.api.ts           # usuários
│   ├── roles.api.ts           # perfis
│   ├── request-types.api.ts   # tipos de solicitação
│   ├── notifications.api.ts   # notificações
│   ├── dashboard.api.ts       # indicadores
│   ├── reports.api.ts         # PDF
│   ├── audit-logs.api.ts      # auditoria
│   └── attachments.api.ts     # anexos
├── types/
│   ├── auth.types.ts
│   ├── request.types.ts
│   ├── user.types.ts
│   ├── sector.types.ts
│   ├── role.types.ts
│   ├── notification.types.ts
│   ├── dashboard.types.ts
│   └── audit.types.ts
├── hooks/
│   ├── useAuth.ts             # contexto de autenticação
│   ├── useRequests.ts         # queries/mutations de protocolos
│   ├── useTramitations.ts
│   ├── useNotifications.ts
│   ├── useDashboard.ts
│   └── ...
├── contexts/
│   └── AuthContext.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   ├── requests/
│   │   ├── RequestList.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── RequestForm.tsx
│   │   └── RequestTimeline.tsx
│   ├── dashboard/
│   │   ├── OverviewCards.tsx
│   │   ├── StatusChart.tsx
│   │   └── ResponseTimeRanking.tsx
│   └── ...
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── RequestsPage.tsx
│   ├── RequestDetailPage.tsx
│   ├── UsersPage.tsx
│   ├── SectorsPage.tsx
│   └── ...
├── lib/
│   ├── permissions.ts         # helpers de RBAC no frontend
│   └── format.ts             # formatação de datas, status, etc.
└── test/
    ├── mocks/
    │   └── handlers.ts        # MSW handlers
    └── setup.ts
```

---

## 3. Axios Client com Refresh Token Automático

Este é o arquivo **mais crítico** do frontend. Ele gerencia o JWT automaticamente:

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ESSENCIAL — envia o cookie refresh_token
  headers: { 'Content-Type': 'application/json' },
});

// ============================================
// Token em memória (NUNCA em localStorage)
// ============================================
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ============================================
// Interceptor de REQUEST — injeta Bearer token
// ============================================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ============================================
// Interceptor de RESPONSE — refresh automático
// ============================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Se não é 401 ou já tentou retry, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se é a rota de login ou refresh, não tenta refresh
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Se já está refreshing, coloca na fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // O refresh_token vai automaticamente via cookie (withCredentials: true)
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
      accessToken = data.accessToken;
      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      accessToken = null;
      // Redireciona para login
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

### Por que token em memória e não em localStorage?

| Abordagem | XSS Seguro? | Persiste refresh? |
|---|---|---|
| **localStorage** | ❌ Qualquer JS rouba o token | Sim |
| **Memória + cookie httpOnly** | ✅ JS não acessa o refresh | Sim (cookie) |

O `accessToken` fica em variável JavaScript (memória). O `refreshToken` fica num cookie `httpOnly` que o browser envia automaticamente. Se o usuário recarregar a página, o access token é perdido mas o interceptor faz refresh automático na primeira requisição.

---

## 4. Tipos TypeScript (espelhando a API)

```typescript
// src/types/auth.types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  sectorId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role;
  sector: Sector;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: Permissions;
  isSuperadmin: boolean;
}

export interface Permissions {
  view: boolean;
  edit: boolean;
  send: boolean;
  receive: boolean;
  approve: boolean;
  reject: boolean;
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
```

```typescript
// src/types/request.types.ts
export type RequestStatus =
  | 'PROTOCOLADO'
  | 'RECEBIDO_PELO_SETOR'
  | 'EM_ANALISE'
  | 'PENDENTE_DOCUMENTO'
  | 'DEFERIDO'
  | 'INDEFERIDO'
  | 'CONCLUIDO';

export interface ProtocolRequest {
  id: string;
  protocolNumber: string;
  requesterId: string;
  sectorOriginId: string;
  requestTypeId: string;
  description: string;
  status: RequestStatus;
  currentSectorId: string;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  requester: { id: string; name: string; registrationNumber: string };
  requestType: { id: string; name: string; slaDays?: number };
  currentSector: { id: string; name: string; code: string };
  sectorOrigin?: { id: string; name: string; code: string };
  tramitations?: Tramitation[];
  statusHistory?: StatusHistoryEntry[];
  attachments?: Attachment[];
}

export interface Tramitation {
  id: string;
  requestId: string;
  fromSector: { id: string; name: string; code: string };
  toSector: { id: string; name: string; code: string };
  sentBy: { id: string; name: string };
  receivedBy?: { id: string; name: string } | null;
  sentAt: string;
  receivedAt?: string | null;
  notes?: string;
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedBy: { id?: string; name: string };
  justification?: string;
  changedAt: string;
}

export interface CreateRequestDto {
  requestTypeId: string;
  description: string;
}

export interface ForwardDto {
  toSectorCode: string;
  notes?: string;
}

export interface ChangeStatusDto {
  status: RequestStatus;
  justification?: string;
}

export interface ListRequestsParams {
  status?: RequestStatus;
  sectorCode?: string;
  requestTypeId?: string;
  from?: string;
  to?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RequestType {
  id: string;
  name: string;
  slaDays: number;
  flow: string[];
  isActive: boolean;
}
```

```typescript
// src/types/notification.types.ts
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'FORWARDED' | 'STATUS_CHANGED' | 'OVERDUE';
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
}
```

```typescript
// src/types/dashboard.types.ts
export interface DashboardOverview {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  overdue: number;
}

export interface PeriodData {
  period: string;
  total: number;
}

export interface ResponseTimeData {
  sector_name: string;
  sector_code: string;
  avg_hours_to_receive: number;
  total_received: number;
}

export interface UserActivityData {
  user_name: string;
  email: string;
  total_actions: number;
}
```

---

## 5. Módulos de API (um por domínio)

```typescript
// src/api/auth.api.ts
import { api, setAccessToken } from './client';
import type { LoginRequest, LoginResponse, AuthUser } from '../types/auth.types';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', data);
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  async refresh(): Promise<string> {
    const res = await api.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(res.data.accessToken);
    return res.data.accessToken;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    setAccessToken(null);
  },
};
```

```typescript
// src/api/requests.api.ts
import { api } from './client';
import type {
  ProtocolRequest,
  CreateRequestDto,
  ListRequestsParams,
  PaginatedResponse,
} from '../types/request.types';

export const requestsApi = {
  async create(data: CreateRequestDto): Promise<ProtocolRequest> {
    const res = await api.post<ProtocolRequest>('/requests', data);
    return res.data;
  },

  async list(params?: ListRequestsParams): Promise<PaginatedResponse<ProtocolRequest>> {
    const res = await api.get<PaginatedResponse<ProtocolRequest>>('/requests', { params });
    return res.data;
  },

  async getById(id: string): Promise<ProtocolRequest> {
    const res = await api.get<ProtocolRequest>(`/requests/${id}`);
    return res.data;
  },

  async getTimeline(id: string) {
    const res = await api.get(`/requests/${id}/timeline`);
    return res.data;
  },
};
```

```typescript
// src/api/tramitations.api.ts
import { api } from './client';
import type { ForwardDto, ChangeStatusDto } from '../types/request.types';

export const tramitationsApi = {
  async forward(requestId: string, data: ForwardDto) {
    const res = await api.post(`/requests/${requestId}/forward`, data);
    return res.data;
  },

  async receive(requestId: string) {
    const res = await api.post(`/requests/${requestId}/receive`);
    return res.data;
  },

  async changeStatus(requestId: string, data: ChangeStatusDto) {
    const res = await api.patch(`/requests/${requestId}/status`, data);
    return res.data;
  },
};
```

```typescript
// src/api/notifications.api.ts
import { api } from './client';
import type { Notification } from '../types/notification.types';

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const res = await api.get<Notification[]>('/notifications');
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
```

```typescript
// src/api/dashboard.api.ts
import { api } from './client';
import type { DashboardOverview, PeriodData, ResponseTimeData, UserActivityData } from '../types/dashboard.types';
import type { ProtocolRequest } from '../types/request.types';

export const dashboardApi = {
  async overview(): Promise<DashboardOverview> {
    const res = await api.get<DashboardOverview>('/dashboard/overview');
    return res.data;
  },

  async byPeriod(params: { from?: string; to?: string; granularity?: 'day' | 'week' | 'month' }): Promise<PeriodData[]> {
    const res = await api.get<PeriodData[]>('/dashboard/by-period', { params });
    return res.data;
  },

  async responseTime(): Promise<ResponseTimeData[]> {
    const res = await api.get<ResponseTimeData[]>('/dashboard/response-time');
    return res.data;
  },

  async userActivity(limit?: number): Promise<UserActivityData[]> {
    const res = await api.get<UserActivityData[]>('/dashboard/user-activity', { params: { limit } });
    return res.data;
  },

  async overdue(): Promise<ProtocolRequest[]> {
    const res = await api.get<ProtocolRequest[]>('/dashboard/overdue');
    return res.data;
  },
};
```

```typescript
// src/api/reports.api.ts
import { api } from './client';

export const reportsApi = {
  async downloadPdf(params?: {
    from?: string;
    to?: string;
    sectorCode?: string;
    requestTypeId?: string;
    status?: string;
  }): Promise<Blob> {
    const res = await api.get('/reports/requests', {
      params,
      responseType: 'blob', // IMPORTANTE — receber como Blob, não JSON
    });
    return res.data;
  },
};

// Helper para trigger de download no browser
export function triggerPdfDownload(blob: Blob, filename = 'protocolos.pdf') {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
```

```typescript
// src/api/attachments.api.ts
import { api } from './client';

export const attachmentsApi = {
  async upload(requestId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/requests/${requestId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async list(requestId: string) {
    const res = await api.get(`/requests/${requestId}/attachments`);
    return res.data;
  },

  async getDownloadUrl(attachmentId: string): Promise<string> {
    const res = await api.get<{ url: string }>(`/attachments/${attachmentId}/url`);
    return res.data.url;
  },
};
```

---

## 6. Contexto de Autenticação

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { setAccessToken } from '../api/client';
import type { AuthUser, Permissions } from '../types/auth.types';

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
  const [isLoading, setIsLoading] = useState(true); // true no início — tentando refresh

  // Na montagem, tenta recuperar a sessão via refresh token (cookie)
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
    await authApi.logout();
    setUser(null);
  }, []);

  // Helper de permissão — usado em toda a UI
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
```

---

## 7. Rota Protegida

```typescript
// src/components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Permissions } from '../../types/auth.types';

interface Props {
  requiredPermission?: keyof Permissions;
}

export function ProtectedRoute({ requiredPermission }: Props) {
  const { isAuthenticated, isLoading, can } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/sem-permissao" replace />;
  }

  return <Outlet />;
}
```

```typescript
// src/App.tsx — Rotas
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s de cache antes de revalidar
      retry: 1,                  // 1 retry em caso de falha
      refetchOnWindowFocus: true, // recarrega ao voltar para a aba
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/timeline/:id" element={<PublicTimelinePage />} />

            {/* Protegidas — qualquer usuário autenticado */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/protocolos" element={<RequestsPage />} />
                <Route path="/protocolos/:id" element={<RequestDetailPage />} />
                <Route path="/notificacoes" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Protegidas — precisa de permissão 'send' */}
            <Route element={<ProtectedRoute requiredPermission="send" />}>
              <Route element={<AppLayout />}>
                <Route path="/protocolos/novo" element={<NewRequestPage />} />
              </Route>
            </Route>

            {/* Protegidas — precisa de permissão 'edit' (admin) */}
            <Route element={<ProtectedRoute requiredPermission="edit" />}>
              <Route element={<AppLayout />}>
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/setores" element={<SectorsPage />} />
                <Route path="/perfis" element={<RolesPage />} />
                <Route path="/tipos-solicitacao" element={<RequestTypesPage />} />
                <Route path="/auditoria" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 8. Hooks com TanStack Query (React Query)

```typescript
// src/hooks/useRequests.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../api/requests.api';
import { tramitationsApi } from '../api/tramitations.api';
import type { ListRequestsParams, CreateRequestDto, ForwardDto, ChangeStatusDto } from '../types/request.types';

// ======= QUERIES =======

export function useRequests(params?: ListRequestsParams) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => requestsApi.list(params),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.getById(id),
    enabled: !!id,
  });
}

export function useTimeline(id: string) {
  return useQuery({
    queryKey: ['timeline', id],
    queryFn: () => requestsApi.getTimeline(id),
    enabled: !!id,
  });
}

// ======= MUTATIONS =======

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequestDto) => requestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useForwardRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ForwardDto }) =>
      tramitationsApi.forward(requestId, data),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', requestId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useReceiveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => tramitationsApi.receive(requestId),
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', requestId] });
    },
  });
}

export function useChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ChangeStatusDto }) =>
      tramitationsApi.changeStatus(requestId, data),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', requestId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

```typescript
// src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000, // Poll a cada 30s para o "sino"
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
```

```typescript
// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.overview(),
    staleTime: 60_000, // 1 minuto — dashboard não precisa ser real-time
  });
}

export function useDashboardByPeriod(params: { from?: string; to?: string; granularity?: 'day' | 'week' | 'month' }) {
  return useQuery({
    queryKey: ['dashboard', 'by-period', params],
    queryFn: () => dashboardApi.byPeriod(params),
  });
}

export function useResponseTime() {
  return useQuery({
    queryKey: ['dashboard', 'response-time'],
    queryFn: () => dashboardApi.responseTime(),
  });
}

export function useOverdueRequests() {
  return useQuery({
    queryKey: ['dashboard', 'overdue'],
    queryFn: () => dashboardApi.overdue(),
  });
}
```

---

## 9. Helpers de Permissão no Frontend

```typescript
// src/lib/permissions.ts
import type { AuthUser, Permissions } from '../types/auth.types';
import type { ProtocolRequest } from '../types/request.types';

/**
 * Verifica se o usuário pode encaminhar este protocolo específico.
 * Regra: precisa de permissão 'send' E estar no setor atual do protocolo (ou ser superadmin).
 */
export function canForward(user: AuthUser, request: ProtocolRequest): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.send && user.sectorId === request.currentSectorId;
}

/**
 * Verifica se o usuário pode receber este protocolo.
 * Regra: precisa de permissão 'receive' E estar no setor destino (currentSector).
 */
export function canReceive(user: AuthUser, request: ProtocolRequest): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.receive && user.sectorId === request.currentSectorId;
}

/**
 * Verifica se o usuário pode alterar o status deste protocolo.
 */
export function canChangeStatus(user: AuthUser): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.edit;
}

/**
 * Retorna os botões de ação disponíveis para este protocolo.
 * Útil para renderizar condicionalmente na UI.
 */
export function getAvailableActions(
  user: AuthUser,
  request: ProtocolRequest,
): Array<'forward' | 'receive' | 'changeStatus'> {
  const actions: Array<'forward' | 'receive' | 'changeStatus'> = [];
  
  const isTerminal = ['DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'].includes(request.status);
  if (isTerminal) return actions;

  if (canForward(user, request)) actions.push('forward');
  if (canReceive(user, request)) actions.push('receive');
  if (canChangeStatus(user)) actions.push('changeStatus');

  return actions;
}
```

```typescript
// src/lib/format.ts

const STATUS_LABELS: Record<string, string> = {
  PROTOCOLADO: 'Protocolado',
  RECEBIDO_PELO_SETOR: 'Recebido pelo Setor',
  EM_ANALISE: 'Em Análise',
  PENDENTE_DOCUMENTO: 'Pendente de Documento',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
  CONCLUIDO: 'Concluído',
};

const STATUS_COLORS: Record<string, string> = {
  PROTOCOLADO: 'bg-blue-100 text-blue-800',
  RECEBIDO_PELO_SETOR: 'bg-cyan-100 text-cyan-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  PENDENTE_DOCUMENTO: 'bg-orange-100 text-orange-800',
  DEFERIDO: 'bg-green-100 text-green-800',
  INDEFERIDO: 'bg-red-100 text-red-800',
  CONCLUIDO: 'bg-gray-100 text-gray-800',
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDeadline(deadlineAt: string, isOverdue: boolean): string {
  const formatted = formatDate(deadlineAt);
  return isOverdue ? `⚠️ ${formatted} (ATRASADO)` : formatted;
}
```

---

## 10. Padrão de Tratamento de Erros

```typescript
// src/lib/errors.ts
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
}

/**
 * Extrai a mensagem de erro legível da resposta da API.
 * A API retorna:
 * - 400: { message: ["campo X inválido", "campo Y obrigatório"], statusCode: 400 }
 * - 401: { message: "Credenciais inválidas", statusCode: 401 }
 * - 403: { message: "Sem permissão", statusCode: 403 }
 * - 404: { message: "Recurso não encontrado", statusCode: 404 }
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    if (Array.isArray(data.message)) {
      return data.message.join('. ');
    }
    return data.message || 'Erro desconhecido';
  }
  if (error instanceof Error) return error.message;
  return 'Erro inesperado. Tente novamente.';
}

/**
 * Retorna o status code HTTP do erro.
 */
export function getErrorStatus(error: unknown): number | null {
  if (error instanceof AxiosError) return error.response?.status ?? null;
  return null;
}
```

Uso no componente:

```typescript
const createRequest = useCreateRequest();

async function handleSubmit(data: CreateRequestDto) {
  try {
    const result = await createRequest.mutateAsync(data);
    toast.success(`Protocolo ${result.protocolNumber} criado com sucesso!`);
    navigate(`/protocolos/${result.id}`);
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
```

---

## 11. Upload de Anexos

```typescript
// Componente de upload
function AttachmentUpload({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação client-side (mesmas regras do backend)
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 5MB.');
      return;
    }

    setUploading(true);
    try {
      await attachmentsApi.upload(requestId, file);
      toast.success('Anexo enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      {uploading ? 'Enviando...' : 'Anexar documento'}
      <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png" />
    </label>
  );
}
```

---

## 12. Download de PDF (Relatórios)

```typescript
function ExportPdfButton({ filters }: { filters: ReportQueryDto }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const blob = await reportsApi.downloadPdf(filters);
      triggerPdfDownload(blob, `protocolos-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleExport} disabled={loading} className="btn-secondary">
      {loading ? 'Gerando PDF...' : 'Exportar PDF'}
    </button>
  );
}
```

---

## 13. Polling de Notificações (Sino)

```typescript
function NotificationBell() {
  const { data: count } = useUnreadCount(); // refetch a cada 30s automaticamente
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/notificacoes')} className="relative p-2">
      <BellIcon className="h-6 w-6" />
      {count && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
```

---

## 14. Testes do Frontend

### 14.1 Setup — MSW (Mock Service Worker)

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3000';

export const handlers = [
  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'admin@semed.prainha.pa.gov.br' && body.password === 'Admin@2026!') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        user: {
          id: '1',
          name: 'Administrador do Sistema',
          email: 'admin@semed.prainha.pa.gov.br',
          registrationNumber: '000001',
          sectorId: 'sector-prot',
          roleId: 'role-admin',
          isActive: true,
          role: {
            id: 'role-admin',
            name: 'Administrador',
            slug: 'admin',
            isSuperadmin: true,
            permissions: { view: true, edit: true, send: true, receive: true, approve: true, reject: true },
          },
          sector: { id: 'sector-prot', name: 'Protocolo', code: 'PROT', isActive: true },
        },
      });
    }
    return HttpResponse.json({ message: 'Credenciais inválidas', statusCode: 401 }, { status: 401 });
  }),

  // Me
  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return HttpResponse.json({ statusCode: 401 }, { status: 401 });
    return HttpResponse.json({
      id: '1',
      name: 'Administrador do Sistema',
      email: 'admin@semed.prainha.pa.gov.br',
      role: { slug: 'admin', isSuperadmin: true, permissions: { view: true, edit: true, send: true, receive: true, approve: true, reject: true } },
      sector: { id: 'sector-prot', name: 'Protocolo', code: 'PROT' },
    });
  }),

  // Requests list
  http.get(`${API_URL}/requests`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'req-1',
          protocolNumber: '2026-PROT-000001',
          status: 'PROTOCOLADO',
          description: 'Licença prêmio',
          createdAt: '2026-03-19T10:00:00Z',
          deadlineAt: '2026-04-18T10:00:00Z',
          isOverdue: false,
          requester: { id: '1', name: 'Admin', registrationNumber: '000001' },
          requestType: { id: 'rt-1', name: 'Licença Prêmio' },
          currentSector: { id: 'sector-prot', name: 'Protocolo', code: 'PROT' },
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  }),

  // Dashboard overview
  http.get(`${API_URL}/dashboard/overview`, () => {
    return HttpResponse.json({
      total: 15,
      byStatus: [
        { status: 'PROTOCOLADO', count: 5 },
        { status: 'EM_ANALISE', count: 4 },
        { status: 'DEFERIDO', count: 6 },
      ],
      overdue: 2,
    });
  }),

  // Notifications
  http.get(`${API_URL}/notifications/unread-count`, () => {
    return HttpResponse.json({ count: 3 });
  }),
];
```

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/test/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 14.2 Testes Unitários de Componentes

```typescript
// src/components/requests/__tests__/RequestList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { RequestList } from '../RequestList';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RequestList', () => {
  it('exibe o número do protocolo na listagem', async () => {
    renderWithProviders(<RequestList />);
    await waitFor(() => {
      expect(screen.getByText('2026-PROT-000001')).toBeInTheDocument();
    });
  });

  it('exibe o status formatado', async () => {
    renderWithProviders(<RequestList />);
    await waitFor(() => {
      expect(screen.getByText('Protocolado')).toBeInTheDocument();
    });
  });

  it('exibe loading state enquanto carrega', () => {
    renderWithProviders(<RequestList />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });
});
```

### 14.3 Testes de Hook

```typescript
// src/hooks/__tests__/useAuth.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  it('começa como não autenticado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Sem refresh token no MSW mock, deve ficar deslogado
  });

  it('login com credenciais válidas retorna usuário', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('admin@semed.prainha.pa.gov.br', 'Admin@2026!');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Administrador do Sistema');
    expect(result.current.can('edit')).toBe(true);
    expect(result.current.isSuperadmin).toBe(true);
  });

  it('login com credenciais inválidas lança erro', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(() => result.current.login('wrong@email.com', 'wrongpassword')),
    ).rejects.toThrow();

    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 14.4 Testes do API Client

```typescript
// src/api/__tests__/client.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { api, setAccessToken, getAccessToken } from '../client';

describe('API Client', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('injeta Bearer token no header quando setado', async () => {
    setAccessToken('test-token');
    
    // Interceptor modifica o config antes de enviar
    const config = await api.interceptors.request.handlers[0].fulfilled!({
      headers: new (await import('axios')).AxiosHeaders(),
      url: '/test',
    } as any);
    
    expect(config.headers.Authorization).toBe('Bearer test-token');
  });

  it('não injeta header quando token é null', async () => {
    const config = await api.interceptors.request.handlers[0].fulfilled!({
      headers: new (await import('axios')).AxiosHeaders(),
      url: '/test',
    } as any);
    
    expect(config.headers.Authorization).toBeUndefined();
  });
});
```

### 14.5 Testes de Permissão

```typescript
// src/lib/__tests__/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { canForward, canReceive, getAvailableActions } from '../permissions';
import type { AuthUser } from '../../types/auth.types';
import type { ProtocolRequest } from '../../types/request.types';

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: '1',
  name: 'Test',
  email: 'test@test.com',
  registrationNumber: '000001',
  sectorId: 'sector-prot',
  roleId: 'role-1',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  role: {
    id: 'role-1',
    name: 'Protocolo',
    slug: 'protocolo',
    isSuperadmin: false,
    permissions: { view: true, edit: true, send: true, receive: true, approve: false, reject: false },
  },
  sector: { id: 'sector-prot', name: 'Protocolo', code: 'PROT', isActive: true },
  ...overrides,
});

const makeRequest = (overrides: Partial<ProtocolRequest> = {}): ProtocolRequest => ({
  id: 'req-1',
  protocolNumber: '2026-PROT-000001',
  requesterId: '1',
  sectorOriginId: 'sector-prot',
  requestTypeId: 'rt-1',
  description: 'Test',
  status: 'PROTOCOLADO',
  currentSectorId: 'sector-prot',
  deadlineAt: '2026-04-18',
  createdAt: '2026-03-19',
  updatedAt: '2026-03-19',
  isOverdue: false,
  requester: { id: '1', name: 'Test', registrationNumber: '000001' },
  requestType: { id: 'rt-1', name: 'Licença Prêmio' },
  currentSector: { id: 'sector-prot', name: 'Protocolo', code: 'PROT' },
  ...overrides,
});

describe('canForward', () => {
  it('permite quando usuário tem send e está no setor correto', () => {
    expect(canForward(makeUser(), makeRequest())).toBe(true);
  });

  it('bloqueia quando usuário está em setor diferente', () => {
    expect(canForward(makeUser({ sectorId: 'sector-rh' }), makeRequest())).toBe(false);
  });

  it('superadmin sempre pode', () => {
    const admin = makeUser({
      sectorId: 'sector-rh',
      role: { ...makeUser().role, isSuperadmin: true },
    });
    expect(canForward(admin, makeRequest())).toBe(true);
  });
});

describe('getAvailableActions', () => {
  it('retorna vazio para protocolos em status terminal', () => {
    expect(getAvailableActions(makeUser(), makeRequest({ status: 'DEFERIDO' }))).toEqual([]);
    expect(getAvailableActions(makeUser(), makeRequest({ status: 'CONCLUIDO' }))).toEqual([]);
  });

  it('retorna forward, receive e changeStatus para usuário do setor correto', () => {
    const actions = getAvailableActions(makeUser(), makeRequest());
    expect(actions).toContain('forward');
    expect(actions).toContain('receive');
    expect(actions).toContain('changeStatus');
  });
});
```

### 14.6 Resumo da Cobertura de Testes

| Camada | Ferramenta | O que testa |
|---|---|---|
| **API Client** | Vitest | Interceptors JWT, refresh automático, injeção de header |
| **Hooks** | Testing Library | Login/logout, loading states, cache invalidation |
| **Componentes** | Testing Library + MSW | Renderização, interação, estados de loading/error |
| **Permissões** | Vitest (puro) | canForward, canReceive, getAvailableActions |
| **Formatação** | Vitest (puro) | formatStatus, formatDate, statusColor |
| **Integração** | Playwright (opcional) | Fluxo completo: login → criar protocolo → encaminhar |

---

## 15. Variáveis de Ambiente do Frontend

```env
# .env
VITE_API_URL=http://localhost:3000
```

```env
# .env.production
VITE_API_URL=https://api.semed.prainha.pa.gov.br
```

---

## 16. Checklist de Implementação

Ordem recomendada para construir o frontend:

| # | O que | Depende de |
|---|---|---|
| 1 | `api/client.ts` + tipos base | Nada |
| 2 | `AuthContext` + `LoginPage` | client.ts |
| 3 | `ProtectedRoute` + layout (Sidebar, Header) | AuthContext |
| 4 | `DashboardPage` (overview, gráficos) | layout |
| 5 | `RequestsPage` (listagem com filtros) | layout |
| 6 | `NewRequestPage` (formulário) | listagem |
| 7 | `RequestDetailPage` (timeline, ações) | listagem |
| 8 | Botões de ação: Encaminhar, Receber, Alterar Status | detalhe |
| 9 | Upload de anexos | detalhe |
| 10 | Notificações (sino + página) | layout |
| 11 | Gestão: Usuários, Setores, Perfis | layout |
| 12 | Relatório PDF (botão de exportação) | listagem |
| 13 | Auditoria (página admin) | layout |
| 14 | Testes com MSW | tudo |

---

Esse guia tem tudo para construir o frontend de forma profissional. O ponto mais crítico é o **`client.ts`** — se o interceptor de refresh estiver correto, todo o resto flui naturalmente. Qualquer dúvida durante a implementação, é só perguntar!