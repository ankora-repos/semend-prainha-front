import { api, getAccessToken } from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const attachmentsApi = {
  async upload(requestId: string, file: File, customFilename?: string) {
    const formData = new FormData();
    // If custom filename provided, create a new File with that name
    if (customFilename) {
      const ext = file.name.match(/\.[^/.]+$/)?.[0] ?? '';
      const hasExt = customFilename.endsWith(ext);
      const finalName = hasExt ? customFilename : `${customFilename}${ext}`;
      const renamedFile = new File([file], finalName, { type: file.type });
      formData.append('file', renamedFile);
    } else {
      formData.append('file', file);
    }
    const res = await api.post(`/requests/${requestId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async rename(attachmentId: string, filename: string) {
    const res = await api.patch(`/attachments/${attachmentId}/rename`, { filename });
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

  /**
   * Returns a blob URL for inline preview via backend proxy.
   * The backend streams the file from Supabase, bypassing CORS/X-Frame-Options.
   */
  async getPreviewUrl(attachmentId: string): Promise<string> {
    const res = await api.get(`/attachments/${attachmentId}/file`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(res.data);
  },

  /**
   * Builds a direct URL to the backend file proxy endpoint (with auth token).
   * Useful for <object>/<iframe> src where we need a plain URL, not a fetch call.
   */
  getFileProxyUrl(attachmentId: string): string {
    const token = getAccessToken();
    return `${API_URL}/attachments/${attachmentId}/file?token=${encodeURIComponent(token ?? '')}`;
  },
};
