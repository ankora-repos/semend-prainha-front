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

/**
 * Igual ao extractErrorMessage, mas também lê os erros que chegaram como arquivo
 * (requisições com responseType: 'blob', como os PDFs). Nesses casos a mensagem
 * real do servidor vem dentro do Blob — sem isso o usuário só via "código 400".
 */
export async function extractErrorMessageAsync(error: unknown): Promise<string> {
  if (error instanceof AxiosError && error.response?.data instanceof Blob) {
    const status = error.response.status;
    if (status === 401) return 'Sessão expirada. Faça login novamente.';
    if (status === 403) return 'Sem permissão para esta ação.';
    try {
      const data = JSON.parse(await error.response.data.text()) as ApiErrorResponse;
      const message = Array.isArray(data.message) ? data.message.join('. ') : data.message;
      if (message) return message;
    } catch {
      // Corpo não era JSON (ex.: HTML de proxy) — usa a mensagem genérica.
    }
    return `Erro ao gerar o documento (código ${status}).`;
  }
  return extractErrorMessage(error);
}

export function getErrorStatus(error: unknown): number | null {
  if (error instanceof AxiosError) return error.response?.status ?? null;
  return null;
}
