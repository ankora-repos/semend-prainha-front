import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests.api';
import { requestTypesApi } from '@/api/request-types.api';
import { reportsApi, triggerPdfDownload } from '@/api/reports.api';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, FileText, Printer, CheckCircle2, ArrowRight } from 'lucide-react';
import type { CreateRequestDto, ProtocolRequest } from '@/types/request.types';

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
  const [createdRequest, setCreatedRequest] = useState<ProtocolRequest | null>(null);
  const [printing, setPrinting] = useState(false);

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
      setCreatedRequest(result);
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  async function handlePrintReceipt() {
    if (!createdRequest) return;
    setPrinting(true);
    try {
      const blob = await reportsApi.downloadReceipt(createdRequest.id);
      triggerPdfDownload(blob, `comprovante-${createdRequest.protocolNumber}.pdf`);
    } catch (err) {
      toast.error('Erro ao gerar comprovante: ' + extractErrorMessage(err));
    } finally {
      setPrinting(false);
    }
  }

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatRg(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.replace(/(\d{2})(\d)/, '$1.$2');
    if (digits.length <= 8) return digits.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3');
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  function getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  const birthDateError = requesterBirthDate && getAge(requesterBirthDate) < 18
    ? 'O solicitante deve ter 18 anos ou mais'
    : '';

  const rgDigits = requesterRg.replace(/\D/g, '');
  const rgError = rgDigits.length > 0 && (rgDigits.length < 7 || rgDigits.length > 9)
    ? 'RG deve ter entre 7 e 9 dígitos'
    : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (birthDateError) return toast.error(birthDateError);
    if (rgError) return toast.error(rgError);
    const data: CreateRequestDto = { requestTypeId, description };
    if (registrationNumber.trim()) data.registrationNumber = registrationNumber.trim();
    if (requesterName.trim()) data.requesterName = requesterName.trim();
    if (requesterCpf.trim()) data.requesterCpf = requesterCpf.trim();
    if (requesterRg.trim()) data.requesterRg = requesterRg.trim();
    if (requesterBirthDate) data.requesterBirthDate = requesterBirthDate;
    createMutation.mutate(data);
  }

  // ── Success Screen ──────────────────────────────────
  if (createdRequest) {
    return (
      <div className="max-w-lg mx-auto mt-8 sm:mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-2xl border border-surface-200/60 bg-white p-8 sm:p-10 shadow-xs text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-surface-900">Protocolo Criado!</h1>
            <p className="text-surface-500 text-sm">
              O protocolo foi registrado com sucesso no sistema.
            </p>
          </div>

          <div className="rounded-xl bg-surface-50 border border-surface-100 p-5 space-y-3">
            <div>
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Número do Protocolo</p>
              <p className="text-xl font-bold text-surface-900 mt-1 font-mono tracking-tight">
                {createdRequest.protocolNumber}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-xs text-surface-400">Tipo</p>
                <p className="text-sm font-medium text-surface-700">{createdRequest.requestType?.name}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Setor Atual</p>
                <p className="text-sm font-medium text-surface-700">{createdRequest.currentSector?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
            <button
              onClick={handlePrintReceipt}
              disabled={printing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {printing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando PDF...</>
              ) : (
                <><Printer className="h-4 w-4" /> Imprimir Comprovante</>
              )}
            </button>
            <button
              onClick={() => navigate(`/protocolos/${createdRequest.id}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-3 text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-all"
            >
              Ver Protocolo <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setCreatedRequest(null);
              setRequestTypeId('');
              setDescription('');
              setRegistrationNumber('');
              setRequesterName('');
              setRequesterCpf('');
              setRequesterRg('');
              setRequesterBirthDate('');
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Criar outro protocolo
          </button>
        </div>
      </div>
    );
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
                onChange={(e) => setRequesterRg(formatRg(e.target.value))}
                placeholder="00.000.000-0"
                maxLength={12}
                className={`w-full rounded-lg border bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:ring-2 ${rgError ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : 'border-surface-200 focus:border-primary-400 focus:ring-primary-100'}`}
              />
              {rgError && <p className="text-xs text-danger-500 mt-1">{rgError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Data de Nascimento</label>
              <input
                type="date"
                value={requesterBirthDate}
                onChange={(e) => setRequesterBirthDate(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className={`w-full rounded-lg border bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:ring-2 ${birthDateError ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : 'border-surface-200 focus:border-primary-400 focus:ring-primary-100'}`}
              />
              {birthDateError && <p className="text-xs text-danger-500 mt-1">{birthDateError}</p>}
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
