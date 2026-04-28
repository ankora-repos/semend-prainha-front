import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    // When responseType is 'blob', data is a Blob and won't have .message
    if (data instanceof Blob) {
      const status = error.response.status;
      if (status === 401) return 'Sessão expirada. Faça login novamente.';
      if (status === 403) return 'Sem permissão para esta ação.';
      return `Erro ao gerar o documento (código ${status}).`;
    }
    if (Array.isArray(data.message)) {
      return data.message.join('. ');
    }
    return data.message || 'Erro desconhecido';
  }
  if (error instanceof Error) return error.message;
  return 'Erro inesperado. Tente novamente.';
}

export function getErrorStatus(error: unknown): number | null {
  if (error instanceof AxiosError) return error.response?.status ?? null;
  return null;
}
