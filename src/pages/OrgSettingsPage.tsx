import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { organizationsApi } from '@/api/organizations.api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/errors';
import { Upload, Trash2, Image, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_MAX_SIZE = 512 * 1024; // 512KB
const LOGO_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function OrgSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { organization, setSlug } = useOrganization();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const orgId = user?.organization?.id;
  const currentLogo = previewUrl ?? organization?.logo ?? user?.organization?.logo ?? null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    e.target.value = '';

    if (!LOGO_ALLOWED_TYPES.has(file.type)) {
      toast.error('Formato não suportado. Use PNG, JPG ou WebP.');
      return;
    }
    if (file.size > LOGO_MAX_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 512 KB.');
      return;
    }

    setUploading(true);
    try {
      const result = await organizationsApi.uploadLogo(orgId, file);
      setPreviewUrl(result.logo);

      // Refresh contexts to propagate new logo
      await refreshUser();
      if (organization?.slug) setSlug(organization.slug);

      toast.success('Logo atualizada com sucesso!');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    if (!orgId) return;
    setRemoving(true);
    try {
      await organizationsApi.removeLogo(orgId);
      setPreviewUrl(null);

      await refreshUser();
      if (organization?.slug) setSlug(organization.slug);

      toast.success('Logo removida.');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Configurações</h1>
        <p className="text-surface-500 text-sm mt-1.5 font-medium">
          Personalize a identidade visual da sua organização
        </p>
      </div>

      {/* Logo Upload Card */}
      <div className="rounded-2xl border border-surface-200/60 bg-white p-6 sm:p-8 shadow-xs max-w-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <Image className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-surface-900">Logo da Organização</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo Preview */}
          <div className="shrink-0">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Logo da organização"
                className="h-24 w-24 rounded-2xl object-cover border-2 border-surface-100 shadow-sm"
              />
            ) : (
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-2xl text-white font-bold text-2xl shadow-sm border-2 border-surface-100',
                  !organization?.primaryColor && 'bg-gradient-to-br from-primary-500 to-primary-700',
                )}
                style={organization?.primaryColor ? { backgroundColor: organization.primaryColor } : undefined}
              >
                {organization?.name
                  ? organization.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                  : <Building2 className="h-8 w-8" />}
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-surface-700 font-medium">
                {currentLogo ? 'Logo atual da organização' : 'Nenhuma logo definida'}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Formatos aceitos: PNG, JPG, WebP. Tamanho máximo: 512 KB. Recomendado: 256x256px ou maior, quadrado.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="h-4 w-4" /> {currentLogo ? 'Trocar logo' : 'Enviar logo'}</>
                )}
              </button>

              {currentLogo && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={removing}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {removing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Trash2 className="h-4 w-4" /> Remover</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
