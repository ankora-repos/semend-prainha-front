import { api } from './client';

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

  /** Fetches the file as a blob and returns a local object URL for preview */
  async getPreviewUrl(attachmentId: string): Promise<string> {
    const res = await api.get<{ url: string }>(`/attachments/${attachmentId}/url`);
    const signedUrl = res.data.url;
    // Fetch the actual file as blob to bypass Supabase X-Frame-Options / CSP headers
    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) throw new Error('Falha ao carregar arquivo');
    const blob = await fileRes.blob();
    return URL.createObjectURL(blob);
  },
};
