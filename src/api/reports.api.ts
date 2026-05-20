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
      responseType: 'blob',
    });
    return res.data;
  },

  async downloadReceipt(requestId: string): Promise<Blob> {
    const res = await api.get(`/reports/requests/${requestId}/receipt`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

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
