import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestTypesApi } from '@/api/request-types.api';
import type { CreateRequestTypeDto } from '@/api/request-types.api';
import { sectorsApi } from '@/api/sectors.api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import {
  Loader2, ClipboardList, Clock, Activity, ArrowRight, Plus, X,
  Pencil, Trash2, GripVertical, ChevronUp, ChevronDown,
} from 'lucide-react';
import type { RequestType } from '@/types/request.types';

interface FormState {
  name: string;
  slaDays: string;
  flow: string[];
}

const emptyForm: FormState = { name: '', slaDays: '', flow: [] };

export function RequestTypesPage() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['request-types'], queryFn: () => requestTypesApi.list() });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => sectorsApi.list() });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sectorToAdd, setSectorToAdd] = useState('');

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(t: RequestType) {
    setEditingId(t.id);
    setForm({ name: t.name, slaDays: String(t.slaDays), flow: [...t.flow] });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setSectorToAdd('');
  }

  function addSectorToFlow() {
    if (!sectorToAdd || form.flow.includes(sectorToAdd)) return;
    setForm((f) => ({ ...f, flow: [...f.flow, sectorToAdd] }));
    setSectorToAdd('');
  }

  function removeSectorFromFlow(code: string) {
    setForm((f) => ({ ...f, flow: f.flow.filter((c) => c !== code) }));
  }

  function moveSector(index: number, direction: 'up' | 'down') {
    setForm((f) => {
      const newFlow = [...f.flow];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= newFlow.length) return f;
      [newFlow[index], newFlow[target]] = [newFlow[target], newFlow[index]];
      return { ...f, flow: newFlow };
    });
  }

  const saveMutation = useMutation({
    mutationFn: (data: CreateRequestTypeDto) =>
      editingId ? requestTypesApi.update(editingId, data) : requestTypesApi.create(data),
    onSuccess: () => {
      toast.success(editingId ? 'Tipo atualizado!' : 'Tipo criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['request-types'] });
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestTypesApi.remove(id),
    onSuccess: () => {
      toast.success('Tipo desativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['request-types'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slaDays = parseInt(form.slaDays, 10);
    if (!form.name.trim() || isNaN(slaDays) || slaDays < 1 || form.flow.length === 0) {
      toast.error('Preencha todos os campos e adicione pelo menos um setor ao fluxo.');
      return;
    }
    saveMutation.mutate({ name: form.name.trim(), slaDays, flow: form.flow });
  }

  function handleDelete(t: RequestType) {
    if (!confirm(`Deseja desativar o tipo "${t.name}"?`)) return;
    deleteMutation.mutate(t.id);
  }

  const availableSectors = sectors?.filter((s) => s.isActive && !form.flow.includes(s.code)) ?? [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Tipos de Solicitação</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">Configuração de SLA e fluxo de tramitação ({types?.length ?? 0})</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Tipo
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-surface-500 font-medium">Carregando tipos...</p>
        </div>
      ) : !types?.length ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-1">Nenhum tipo cadastrado</h3>
          <p className="text-surface-500 text-sm max-w-[250px] mb-4">Crie o primeiro tipo de solicitação para começar.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
            <Plus className="h-4 w-4" /> Criar Tipo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {types?.map((t) => (
            <div key={t.id} className="group relative rounded-2xl border border-surface-200/60 bg-white p-6 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col">
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(t)}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                  title="Desativar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 text-primary-600 ring-1 ring-primary-100/50 group-hover:scale-105 transition-transform duration-300">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900 leading-tight mb-1">{t.name}</h3>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                    t.isActive ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', t.isActive ? 'bg-success-500' : 'bg-surface-400')} />
                    {t.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-surface-50/50 border border-surface-100">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                    <Clock className="h-3.5 w-3.5" /> SLA
                  </p>
                  <p className="text-sm font-bold text-surface-900">
                    {t.slaDays} <span className="text-xs font-medium text-surface-500">dias</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                    <Activity className="h-3.5 w-3.5" /> Etapas
                  </p>
                  <p className="text-sm font-bold text-surface-900">
                    {t.flow.length} <span className="text-xs font-medium text-surface-500">setores</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Fluxo de Tramitação</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {t.flow.map((code, i) => (
                    <div key={i} className="flex items-center gap-1.5 border border-transparent">
                      <span className="inline-flex items-center rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-bold text-surface-700 ring-1 ring-surface-200/60 transition-colors group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:ring-primary-100/50">
                        {code}
                      </span>
                      {i < t.flow.length - 1 && <ArrowRight className="h-3 w-3 text-surface-300" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
              <h2 className="text-lg font-bold text-surface-900">
                {editingId ? 'Editar Tipo de Solicitação' : 'Novo Tipo de Solicitação'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Licença Prêmio"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">SLA (dias úteis) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.slaDays}
                  onChange={(e) => setForm((f) => ({ ...f, slaDays: e.target.value }))}
                  placeholder="Ex: 30"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Flow builder */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Fluxo de Tramitação *</label>
                <p className="text-xs text-surface-400 mb-3">Adicione os setores na ordem que o protocolo deve percorrer.</p>

                {form.flow.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {form.flow.map((code, i) => (
                      <div key={code} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                        <GripVertical className="h-4 w-4 text-surface-300 shrink-0" />
                        <span className="text-xs font-bold text-surface-500 w-5">{i + 1}.</span>
                        <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700 ring-1 ring-primary-100">
                          {code}
                        </span>
                        <span className="text-sm text-surface-600">
                          {sectors?.find((s) => s.code === code)?.name ?? code}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSector(i, 'up')}
                            disabled={i === 0}
                            className="rounded p-1 text-surface-400 hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSector(i, 'down')}
                            disabled={i === form.flow.length - 1}
                            className="rounded p-1 text-surface-400 hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSectorFromFlow(code)}
                            className="rounded p-1 text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Flow preview */}
                {form.flow.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                    {form.flow.map((code, i) => (
                      <div key={code} className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary-700 ring-1 ring-primary-200">
                          {code}
                        </span>
                        {i < form.flow.length - 1 && <ArrowRight className="h-3 w-3 text-primary-400" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add sector */}
                <div className="flex gap-2">
                  <select
                    value={sectorToAdd}
                    onChange={(e) => setSectorToAdd(e.target.value)}
                    className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="">Selecione um setor...</option>
                    {availableSectors.map((s) => (
                      <option key={s.id} value={s.code}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addSectorToFlow}
                    disabled={!sectorToAdd}
                    className="rounded-lg bg-surface-100 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                  ) : editingId ? 'Salvar Alterações' : 'Criar Tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
