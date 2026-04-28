import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests.api';
import { requestTypesApi } from '@/api/request-types.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import type { CreateRequestDto } from '@/types/request.types';

export function NewRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [requestTypeId, setRequestTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterCpf, setRequesterCpf] = useState('');
  const [requesterRg, setRequesterRg] = useState('');
  const [requesterBirthDate, setRequesterBirthDate] = useState('');

  const { data: requestTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['request-types'],
    queryFn: () => requestTypesApi.list(),
  });

  const selectedType = requestTypes?.find((rt) => rt.id === requestTypeId);

  const createMutation = useMutation({
    mutationFn: (data: CreateRequestDto) => requestsApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Protocolo ${result.protocolNumber} criado com sucesso!`);
      navigate(`/protocolos/${result.id}`);
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: CreateRequestDto = { requestTypeId, description };
    if (registrationNumber.trim()) data.registrationNumber = registrationNumber.trim();
    if (requesterName.trim()) data.requesterName = requesterName.trim();
    if (requesterCpf.trim()) data.requesterCpf = requesterCpf.trim();
    if (requesterRg.trim()) data.requesterRg = requesterRg.trim();
    if (requesterBirthDate) data.requesterBirthDate = requesterBirthDate;
    createMutation.mutate(data);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Novo Protocolo</h1>
          <p className="text-surface-500 mt-0.5">Abra uma nova solicitação protocolada</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-surface-200 bg-white p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Tipo de Solicitação *
          </label>
          {loadingTypes ? (
            <div className="flex items-center gap-2 text-surface-400 text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando tipos...
            </div>
          ) : (
            <select
              value={requestTypeId}
              onChange={(e) => setRequestTypeId(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Selecione o tipo de solicitação</option>
              {requestTypes?.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} (SLA: {rt.slaDays} dias)
                </option>
              ))}
            </select>
          )}
          {selectedType && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-surface-400">Fluxo:</span>
              {selectedType.flow.map((code, i) => (
                <span key={code} className="inline-flex items-center gap-1">
                  <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                    {code}
                  </span>
                  {i < selectedType.flow.length - 1 && (
                    <span className="text-xs text-surface-300">→</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Matrícula do Solicitante (opcional)
          </label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Deixe vazio para usar seu próprio usuário"
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Dados do Solicitante */}
        <div className="border-t border-surface-100 pt-5">
          <h3 className="text-sm font-semibold text-surface-800 mb-4">Dados do Solicitante (pessoa física)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Nome Completo</label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Nome do solicitante"
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">CPF</label>
              <input
                type="text"
                value={requesterCpf}
                onChange={(e) => setRequesterCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">RG</label>
              <input
                type="text"
                value={requesterRg}
                onChange={(e) => setRequesterRg(e.target.value)}
                placeholder="Número do RG"
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Data de Nascimento</label>
              <input
                type="date"
                value={requesterBirthDate}
                onChange={(e) => setRequesterBirthDate(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Descreva detalhadamente a solicitação..."
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !requestTypeId || !description.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Criar Protocolo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
