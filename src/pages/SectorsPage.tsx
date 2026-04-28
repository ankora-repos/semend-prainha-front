import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectorsApi } from '@/api/sectors.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { Plus, Loader2, Building2, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SectorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data: sectors, isLoading } = useQuery({ queryKey: ['sectors'], queryFn: () => sectorsApi.list() });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; code: string }) => sectorsApi.create(data),
    onSuccess: () => { 
      toast.success('Setor criado com sucesso!'); 
      setShowForm(false); 
      setName(''); 
      setCode(''); 
      queryClient.invalidateQueries({ queryKey: ['sectors'] }); 
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Setores</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">{sectors?.length ?? 0} áreas cadastradas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Novo Setor
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando setores...</p>
        </div>
      ) : !sectors?.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum setor cadastrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px]">Adicione um novo setor para organizar os protocolos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sectors?.map((s) => (
            <div key={s.id} className="group relative rounded-2xl border border-surface-200/60 bg-white p-5 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-50/50 to-transparent rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-50"></div>
              
              <div className="flex items-start gap-3.5 mb-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100/50 group-hover:scale-105 transition-transform duration-300">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <p className="text-base font-bold text-surface-900 line-clamp-2 leading-tight">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                      <MapPin className="h-3 w-3" />
                      Código
                    </span>
                    <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">{s.code}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500">Status do sistema</span>
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold', 
                  s.isActive ? 'bg-success-50 text-success-700 ring-1 ring-success-100' : 'bg-surface-100 text-surface-500'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', s.isActive ? 'bg-success-500' : 'bg-surface-400')} />
                  {s.isActive ? 'Operacional' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Setor */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight">Novo Setor</h3>
                <p className="text-sm text-surface-500 font-medium mt-1">Defina o nome e código da área.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors -mt-4 -mr-2"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name, code: code.toUpperCase() }); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Nome do Setor</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Recursos Humanos" 
                  className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300 placeholder:text-surface-400" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Código Único</label>
                <input 
                  type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  maxLength={10} placeholder="Ex: RH" 
                  className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-bold text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300 uppercase placeholder:normal-case placeholder:font-medium placeholder:text-surface-400" 
                />
                <p className="text-[11px] text-surface-400 font-medium mt-1.5">Máximo de 10 caracteres alfanuméricos.</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
