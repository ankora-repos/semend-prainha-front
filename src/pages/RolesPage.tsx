import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/api/roles.api';
import { Loader2, Shield, ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERM_LABELS: Record<string, string> = {
  view: 'Visualizar', 
  edit: 'Editar', 
  send: 'Enviar', 
  receive: 'Receber', 
  approve: 'Aprovar', 
  reject: 'Rejeitar',
};

export function RolesPage() {
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list() });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Perfis de Acesso</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">Gerencie os perfis e permissões do sistema ({roles?.length ?? 0})</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando perfis...</p>
        </div>
      ) : !roles?.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum perfil cadastrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px]">Entre em contato com o suporte para configurar os perfis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles?.map((r) => (
            <div key={r.id} className="group flex flex-col rounded-2xl border border-surface-200/60 bg-white p-6 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105",
                  r.isSuperadmin 
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 ring-amber-200/60" 
                    : "bg-gradient-to-br from-primary-50 to-indigo-50 text-primary-600 ring-primary-100/50"
                )}>
                  {r.isSuperadmin ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                </div>
                <div className="pt-0.5 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-surface-900 leading-tight">{r.name}</h3>
                    {r.isSuperadmin && (
                      <span className="inline-flex items-center rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-surface-400 font-mono tracking-tight bg-surface-50 px-1.5 py-0.5 rounded border border-surface-100">
                    {r.slug}
                  </span>
                </div>
              </div>
              
              <div className="mt-auto pt-5 border-t border-surface-100/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-3">Permissões Específicas</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(r.permissions).map(([key, isAllowed]) => (
                    <span 
                      key={key} 
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors",
                        isAllowed 
                          ? "border-success-200/60 bg-success-50/50 text-success-700" 
                          : "border-surface-200/60 bg-surface-50/50 text-surface-400"
                      )}
                    >
                      {isAllowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
                      <span className={!isAllowed ? "line-through opacity-70" : ""}>
                        {PERM_LABELS[key] ?? key}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
