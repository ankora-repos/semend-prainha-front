import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests.api';
import { tramitationsApi } from '@/api/tramitations.api';
import { attachmentsApi } from '@/api/attachments.api';
import { auditLogsApi } from '@/api/audit-logs.api';
import type { ProtocolActivity } from '@/api/audit-logs.api';
import { sectorsApi } from '@/api/sectors.api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatStatus, statusColor, formatDateTime, formatDate, formatDeadline, formatFileSize } from '@/lib/format';
import { canForward, canReceive, canChangeStatus } from '@/lib/permissions';
import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import type { RequestStatus, ChangeStatusDto } from '@/types/request.types';
import {
  ArrowLeft, Loader2, Send, CheckCircle, FileUp, Paperclip, Download,
  Clock, AlertTriangle, Building2, User, ChevronDown, X, MessageSquare, ArrowRight,
  Pencil, Eye, FileText as FileTextIcon, Image as ImageIcon, Activity,
} from 'lucide-react';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.getById(id!),
    enabled: !!id,
  });

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.list(),
  });

  const { data: activities } = useQuery({
    queryKey: ['protocol-activity', id],
    queryFn: () => auditLogsApi.getProtocolActivity(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  // Modals
  const [showForward, setShowForward] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [forwardCode, setForwardCode] = useState('');
  const [forwardNotes, setForwardNotes] = useState('');
  const [newStatus, setNewStatus] = useState<RequestStatus>('EM_ANALISE');
  const [justification, setJustification] = useState('');

  // Upload with rename
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadFilename, setUploadFilename] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');

  const forwardMutation = useMutation({
    mutationFn: () => tramitationsApi.forward(id!, { toSectorCode: forwardCode, notes: forwardNotes || undefined }),
    onSuccess: () => {
      toast.success('Protocolo encaminhado!');
      setShowForward(false);
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const receiveMutation = useMutation({
    mutationFn: () => tramitationsApi.receive(id!),
    onSuccess: () => {
      toast.success('Recebimento confirmado!');
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (data: ChangeStatusDto) => tramitationsApi.changeStatus(id!, data),
    onSuccess: () => {
      toast.success('Status atualizado!');
      setShowStatus(false);
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be selected again
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) { toast.error('Arquivo muito grande. Máximo: 5 MB.'); return; }
    // Remove extension for the editable name
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setUploadFilename(nameWithoutExt);
    setPendingFile(file);
  }

  async function handleConfirmUpload() {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      await attachmentsApi.upload(id!, pendingFile, uploadFilename || undefined);
      toast.success('Anexo enviado!');
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      setPendingFile(null);
      setUploadFilename('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(attachmentId: string) {
    try {
      const url = await attachmentsApi.getDownloadUrl(attachmentId);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handlePreview(attachmentId: string, filename: string, mimeType: string) {
    try {
      const url = await attachmentsApi.getPreviewUrl(attachmentId);
      setPreviewUrl(url);
      setPreviewMime(mimeType);
      setPreviewName(filename);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-sm font-medium text-surface-500">Carregando detalhes do protocolo...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="h-16 w-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-bold text-surface-900 mb-1">Protocolo não encontrado</h3>
        <p className="text-surface-500 max-w-sm">O protocolo solicitado não existe ou você não tem permissão para acessá-lo.</p>
        <button onClick={() => navigate('/protocolos')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-surface-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-surface-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para lista
        </button>
      </div>
    );
  }

  const colors = statusColor(request.status);
  const isTerminal = ['DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'].includes(request.status);
  const needsJustification = newStatus === 'INDEFERIDO' || newStatus === 'PENDENTE_DOCUMENTO';

  const availableStatuses: RequestStatus[] = [
    'EM_ANALISE', 'PENDENTE_DOCUMENTO', 'DEFERIDO', 'INDEFERIDO', 'CONCLUIDO',
  ];

  // Next sector from flow
  const flow = request.requestType?.flow ?? [];
  const currentIdx = flow.indexOf(request.currentSector.code);
  const nextSectorCode = currentIdx >= 0 && currentIdx < flow.length - 1 ? flow[currentIdx + 1] : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/protocolos')}
            className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200/60 bg-white text-surface-500 shadow-sm transition-all hover:bg-surface-50 hover:text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-100 mt-1"
            aria-label="Voltar para protocolos"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">#{request.protocolNumber}</h1>
              <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm saturate-150', colors.bg, colors.text, 'border-current/10')}>
                <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', colors.dot)} />
                {formatStatus(request.status)}
              </span>
              {request.isOverdue && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-danger-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-danger-700 shadow-sm animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5" /> Atrasado
                </span>
              )}
            </div>
            <p className="text-surface-500 font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-400 inline-block" />
              {request.requestType.name}
            </p>
          </div>
        </div>

        {/* Actions Desktop */}
        {!isTerminal && user && (
          <div className="hidden sm:flex flex-wrap items-center gap-2 justify-end">
            {canForward(user, request) && nextSectorCode && (
              <button
                onClick={() => { setForwardCode(nextSectorCode); setShowForward(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:shadow-md hover:bg-primary-700 hover:-translate-y-0.5 transition-all"
              >
                <Send className="h-4 w-4" /> Tramitar → {nextSectorCode}
              </button>
            )}
            {canReceive(user, request) && request.status === 'PROTOCOLADO' && (
              <button
                onClick={() => receiveMutation.mutate()}
                disabled={receiveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-success-200/60 bg-success-50 px-4 py-2 text-sm font-bold text-success-700 shadow-sm hover:bg-success-100 hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {receiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar Recebimento
              </button>
            )}
            {canChangeStatus(user) && (
              <button
                onClick={() => setShowStatus(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200/80 bg-white px-4 py-2 text-sm font-bold text-surface-700 shadow-sm hover:bg-surface-50 hover:border-surface-300 transition-all"
              >
                <ChevronDown className="h-4 w-4" /> Status
              </button>
            )}
            {user.role.permissions.send && (
              <label className="inline-flex items-center gap-2 rounded-xl border border-surface-200/80 bg-white px-4 py-2 text-sm font-bold text-surface-700 shadow-sm hover:bg-surface-50 hover:border-surface-300 transition-all cursor-pointer">
                <FileUp className="h-4 w-4" /> Anexar
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
              </label>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Actions Mobile */}
          {!isTerminal && user && (
            <div className="flex sm:hidden flex-wrap gap-2">
              {canForward(user, request) && nextSectorCode && (
                <button
                  onClick={() => { setForwardCode(nextSectorCode); setShowForward(true); }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
                >
                  <Send className="h-4 w-4" /> Enviar para {nextSectorCode}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 w-full">
                {canReceive(user, request) && request.status === 'PROTOCOLADO' && (
                  <button
                    onClick={() => receiveMutation.mutate()}
                    disabled={receiveMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-success-200/60 bg-success-50 px-4 py-2.5 text-xs font-bold text-success-700 shadow-sm active:scale-[0.98] transition-all"
                  >
                    {receiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Receber
                  </button>
                )}
                {canChangeStatus(user) && (
                  <button
                    onClick={() => setShowStatus(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-xs font-bold text-surface-700 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <ChevronDown className="h-4 w-4" /> Alterar Status
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-2xl border border-surface-200/60 bg-white shadow-sm overflow-hidden flex flex-col">
             <div className="bg-surface-50/50 px-6 py-4 border-b border-surface-100/60 flex items-center justify-between">
               <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 uppercase tracking-wider">
                 <MessageSquare className="h-4 w-4 text-primary-500" /> Descrição da Solicitação
               </h3>
             </div>
             <div className="p-6">
               <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed font-medium">
                 {request.description}
               </p>
             </div>
          </div>

          {/* Activity Feed */}
          {activities && activities.length > 0 && (
            <div className="rounded-2xl border border-surface-200/60 bg-white shadow-sm overflow-hidden">
              <div className="bg-surface-50/50 px-6 py-4 border-b border-surface-100/60">
                <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="h-4 w-4 text-primary-500" /> Registro de Atividades
                </h3>
              </div>
              <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto">
                <div className="space-y-0">
                  {activities.map((act, i) => (
                    <ActivityItem key={act.id} activity={act} isLast={i === activities.length - 1} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl border border-surface-200/60 bg-white shadow-sm overflow-hidden">
            <div className="bg-surface-50/50 px-6 py-4 border-b border-surface-100/60">
               <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 uppercase tracking-wider">
                 <Clock className="h-4 w-4 text-primary-500" /> Histórico e Tramitações
               </h3>
            </div>
            <div className="p-6">
              <div className="space-y-0">
                {(request.statusHistory ?? []).map((entry, i, arr) => {
                  const entryColors = statusColor(entry.newStatus);
                  return (
                    <div key={entry.id} className="relative flex gap-5 pb-8 last:pb-0 group">
                      {i < arr.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gradient-to-b from-surface-200 to-transparent group-hover:from-surface-300 transition-colors" />
                      )}
                      <div className={cn('relative z-10 mt-1 h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white transition-transform group-hover:scale-110 duration-300', entryColors.bg)}>
                        <div className={cn('h-2.5 w-2.5 rounded-full', entryColors.dot)} />
                      </div>
                      <div className="flex-1 min-w-0 bg-surface-50/30 rounded-xl p-4 border border-surface-100/50 transition-colors hover:bg-surface-50 group-hover:border-surface-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className={cn('inline-flex w-fit text-xs font-bold rounded-lg px-2.5 py-1 uppercase tracking-wider saturate-150', entryColors.bg, entryColors.text)}>
                            {formatStatus(entry.newStatus)}
                          </span>
                          <span className="text-xs font-semibold text-surface-400 bg-white px-2 py-1 rounded-md border border-surface-200/50 shadow-xs flex items-center gap-1.5 w-fit">
                            <Clock className="h-3 w-3" /> {formatDateTime(entry.changedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-surface-600 mt-2 font-medium flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-surface-400" /> por <span className="text-surface-900 font-bold">{entry.changedBy.name}</span>
                        </p>
                        {entry.justification && (
                          <div className="mt-3 bg-white p-3 rounded-lg border border-surface-100 text-sm text-surface-600 italic relative">
                            <span className="absolute -left-1 top-2 h-4 w-1 bg-surface-300 rounded-r-md"></span>
                            "{entry.justification}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {request.tramitations && request.tramitations.length > 0 && <div className="my-8 border-t border-dashed border-surface-200" />}

                {(request.tramitations ?? []).map((tram) => (
                  <div key={tram.id} className="relative flex gap-5 pb-8 last:pb-0 group">
                    <div className="relative z-10 mt-1 h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-primary-100 shadow-sm ring-4 ring-white transition-transform group-hover:scale-110 duration-300">
                      <Send className="h-3.5 w-3.5 text-primary-600 translate-x-[1px] -translate-y-[1px]" />
                    </div>
                    <div className="flex-1 min-w-0 bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50 transition-colors hover:bg-indigo-50/50 group-hover:border-indigo-200/60">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <span className="inline-flex w-fit text-xs font-bold text-primary-700 bg-primary-100 border border-primary-200/50 rounded-lg px-2.5 py-1 uppercase tracking-wider">
                          Tramitação Enviada
                        </span>
                        <span className="text-xs font-semibold text-primary-500/80 bg-white px-2 py-1 rounded-md border border-primary-100/50 shadow-xs flex items-center gap-1.5 w-fit">
                          <Clock className="h-3 w-3" /> {formatDateTime(tram.sentAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-surface-900 font-bold mb-3 bg-white p-2.5 rounded-lg border border-surface-100 shadow-xs w-fit">
                        <Building2 className="h-4 w-4 text-surface-400" />
                        {tram.fromSector.name} <ArrowRight className="h-4 w-4 text-surface-300 mx-1" /> {tram.toSector.name}
                      </div>
                      <p className="text-xs text-surface-500 mb-2 font-medium flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-surface-400" /> Enviado por <span className="text-surface-700 font-bold">{tram.sentBy.name}</span>
                      </p>
                      
                      {tram.receivedBy ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-success-700 bg-success-50 px-2 py-1.5 rounded-md border border-success-100 font-semibold mb-2">
                          <CheckCircle className="h-3.5 w-3.5" /> Recebido por {tram.receivedBy.name} em {tram.receivedAt ? formatDateTime(tram.receivedAt) : ''}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100 font-semibold mb-2">
                          <Clock className="h-3.5 w-3.5 animate-pulse" /> Aguardando recebimento
                        </div>
                      )}

                      {tram.notes && (
                        <div className="mt-2 bg-white p-3 rounded-lg border border-surface-100 text-sm text-surface-600 italic relative">
                          <span className="absolute -left-1 top-2 h-4 w-1 bg-surface-300 rounded-r-md"></span>
                          "{tram.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="rounded-2xl border border-surface-200/60 bg-white shadow-sm overflow-hidden">
            <div className="bg-surface-50/50 px-5 py-4 border-b border-surface-100/60">
               <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 uppercase tracking-wider">
                 <AlertTriangle className="h-4 w-4 text-primary-500" /> Resumo
               </h3>
            </div>
            <div className="p-5 space-y-4">
              <InfoRow icon={User} label="Solicitante" value={request.requester.name} />
              {request.requesterName && <InfoRow icon={User} label="Nome (pessoa física)" value={request.requesterName} />}
              {request.requesterCpf && <InfoRow icon={User} label="CPF" value={request.requesterCpf} />}
              {request.requesterRg && <InfoRow icon={User} label="RG" value={request.requesterRg} />}
              {request.requesterBirthDate && <InfoRow icon={Clock} label="Data de Nascimento" value={formatDate(request.requesterBirthDate)} />}
              <InfoRow icon={Building2} label="Setor de Origem" value={request.sectorOrigin?.name ?? 'Protocolo'} />
              <InfoRow icon={Building2} label="Setor Atual" value={request.currentSector.name} highlightBackground />
              <div className="pt-4 border-t border-surface-100/60 space-y-4">
                <InfoRow icon={Clock} label="Criado em" value={formatDate(request.createdAt)} />
                <div className="flex items-start gap-3 p-3 rounded-xl border border-surface-100 bg-surface-50">
                  <AlertTriangle className={cn('h-5 w-5 mt-0.5 shrink-0', request.isOverdue ? 'text-danger-500' : 'text-primary-500')} />
                  <div>
                    <p className="text-xs tracking-wider uppercase font-bold text-surface-500 mb-0.5">Prazo Estimado</p>
                    <p className={cn('text-sm font-bold', request.isOverdue ? 'text-danger-600' : 'text-surface-900')}>
                      {formatDeadline(request.deadlineAt, request.isOverdue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Flow Path */}
              {flow.length > 0 && (
                <div className="pt-4 border-t border-surface-100/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Fluxo de Tramitação</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {flow.map((code, i) => {
                      const isCurrent = code === request.currentSector.code;
                      const isPast = flow.indexOf(request.currentSector.code) > i;
                      
                      return (
                        <div key={code} className="flex items-center gap-1.5">
                          <span className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                            isCurrent
                              ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-600/20 ring-offset-1'
                              : isPast 
                                ? 'bg-success-50 text-success-700 border border-success-200'
                                : 'bg-surface-100 text-surface-500 border border-surface-200',
                          )}>
                            {isPast && <CheckCircle className="h-3 w-3 inline-block mr-1 -mt-0.5" />}
                            {code}
                          </span>
                          {i < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-surface-300" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-2xl border border-surface-200/60 bg-white shadow-sm overflow-hidden">
            <div className="bg-surface-50/50 px-5 py-4 border-b border-surface-100/60 flex items-center justify-between">
               <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 uppercase tracking-wider">
                 <Paperclip className="h-4 w-4 text-primary-500" /> Anexos
               </h3>
               <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                 {request.attachments?.length ?? 0}
               </span>
            </div>

            <div className="p-3">
              {request.attachments && request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((att) => {
                    const isImage = att.mimeType?.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className="group relative flex items-center gap-3 w-full rounded-xl border border-surface-100 p-3 bg-white hover:bg-surface-50 hover:border-primary-200 transition-all"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                          {isImage
                            ? <ImageIcon className="h-5 w-5 text-primary-600" />
                            : <FileTextIcon className="h-5 w-5 text-primary-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-surface-900 truncate">{att.filename}</p>
                          <p className="text-xs font-medium text-surface-400">{formatFileSize(att.sizeBytes)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePreview(att.id, att.filename, att.mimeType ?? 'application/pdf')}
                            title="Visualizar"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(att.id)}
                            title="Baixar"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full border border-dashed border-surface-200 flex items-center justify-center mb-2 bg-surface-50">
                    <Paperclip className="h-5 w-5 text-surface-300" />
                  </div>
                  <p className="text-sm font-medium text-surface-500">Nenhum anexo</p>
                </div>
              )}

              {/* Upload button inline */}
              {user && user.role.permissions.send && !isTerminal && (
                <label className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 p-3 text-sm font-bold text-surface-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30 transition-all cursor-pointer">
                  <FileUp className="h-4 w-4" /> Adicionar anexo
                  <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      {showForward && (
        <Modal onClose={() => setShowForward(false)} title="Tramitar Protocolo" icon={<Send className="h-5 w-5 text-primary-600" />}>
          <form onSubmit={(e) => { e.preventDefault(); forwardMutation.mutate(); }} className="space-y-5">
             <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 mb-2">
               <p className="text-sm text-primary-800 font-medium flex items-start gap-2">
                 <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                 O protocolo será enviado para o próximo setor do fluxo. O setor selecionado precisa estar na lista abaixo.
               </p>
             </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">Setor Destino *</label>
              <div className="relative">
                <select
                  value={forwardCode}
                  onChange={(e) => setForwardCode(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all hover:border-surface-400"
                >
                  <option value="">Selecione o setor da lista</option>
                  {sectors?.map((s) => (
                    <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-surface-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">Observações (opcional)</label>
              <textarea
                value={forwardNotes}
                onChange={(e) => setForwardNotes(e.target.value)}
                rows={4}
                placeholder="Insira notas explicativas para o próximo setor..."
                className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all hover:border-surface-400 resize-y"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
              <button type="button" onClick={() => setShowForward(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors">
                Cancelar Tramitação
              </button>
              <button type="submit" disabled={forwardMutation.isPending || !forwardCode} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md hover:bg-primary-700 disabled:opacity-60 transition-all">
                {forwardMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                Confirmar Envio
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Upload Rename Modal */}
      {pendingFile && (
        <Modal onClose={() => { setPendingFile(null); setUploadFilename(''); }} title="Anexar Arquivo" icon={<FileUp className="h-5 w-5 text-primary-600" />}>
          <div className="space-y-5">
            {/* File preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary-50 flex items-center justify-center">
                {pendingFile.type.startsWith('image/')
                  ? <ImageIcon className="h-5 w-5 text-primary-600" />
                  : <FileTextIcon className="h-5 w-5 text-primary-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-surface-900 truncate">{pendingFile.name}</p>
                <p className="text-xs text-surface-400">{formatFileSize(pendingFile.size)}</p>
              </div>
            </div>

            {/* Image thumbnail preview */}
            {pendingFile.type.startsWith('image/') && (
              <div className="rounded-xl border border-surface-200 overflow-hidden bg-surface-50 flex items-center justify-center p-2">
                <img
                  src={URL.createObjectURL(pendingFile)}
                  alt="Pré-visualização"
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}

            {/* Rename field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                <Pencil className="h-3 w-3 inline mr-1" />
                Nome do arquivo
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  placeholder="Nome do anexo"
                  className="flex-1 rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
                <span className="text-sm font-bold text-surface-400 px-2">
                  {pendingFile.name.match(/\.[^/.]+$/)?.[0] ?? ''}
                </span>
              </div>
              <p className="text-xs text-surface-400 mt-1.5">Renomeie se quiser. A extensão será mantida automaticamente.</p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-surface-100">
              <button
                type="button"
                onClick={() => { setPendingFile(null); setUploadFilename(''); }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md hover:bg-primary-700 disabled:opacity-60 transition-all"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Enviar Anexo
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Eye className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-sm font-bold text-surface-900 truncate">{previewName}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                  title="Abrir em nova aba"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="rounded-full p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-surface-50 min-h-[300px]">
              {previewMime.startsWith('image/') ? (
                <img src={previewUrl} alt={previewName} className="max-w-full max-h-[50vh] sm:max-h-[65vh] rounded-lg object-contain shadow-md" />
              ) : previewMime === 'application/pdf' ? (
                <iframe src={previewUrl} title={previewName} className="w-full h-[50vh] sm:h-[65vh] rounded-lg border border-surface-200" />
              ) : (
                <div className="text-center py-12">
                  <FileTextIcon className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-500">Pré-visualização não disponível para este tipo de arquivo.</p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-bold hover:underline mt-2 inline-block">
                    Abrir em nova aba
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatus && (
        <Modal onClose={() => setShowStatus(false)} title="Alterar Status" icon={<CheckCircle className="h-5 w-5 text-primary-600" />}>
          <form onSubmit={(e) => { e.preventDefault(); statusMutation.mutate({ status: newStatus, justification: justification || undefined }); }} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">Novo Status *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableStatuses.map((s) => {
                  const isSelected = newStatus === s;
                  const c = statusColor(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all text-left",
                        isSelected 
                          ? `border-${c.bg.split('-')[1]}-500 bg-${c.bg.split('-')[1]}-50 ring-2 ring-${c.bg.split('-')[1]}-500/20 text-${c.bg.split('-')[1]}-700 shadow-sm`
                          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50"
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', isSelected ? `bg-${c.bg.split('-')[1]}-500 animate-pulse` : 'bg-surface-300')} />
                      {formatStatus(s)}
                    </button>
                  )
                })}
              </div>
            </div>
            {needsJustification && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                  Justificativa Obrigatória *
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  required
                  rows={4}
                  placeholder="Por favor, explique o motivo da alteração de status..."
                  className="w-full rounded-xl border border-danger-300 bg-danger-50/30 px-4 py-3 text-sm font-medium text-surface-900 outline-none focus:border-danger-500 focus:ring-4 focus:ring-danger-500/20 transition-all hover:border-danger-400 resize-y"
                />
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-surface-100 mt-6">
              <button type="button" onClick={() => setShowStatus(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={statusMutation.isPending || (needsJustification && !justification.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md hover:bg-primary-700 disabled:opacity-60 transition-all">
                {statusMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                Salvar Status
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight, highlightBackground }: { icon: React.ElementType; label: string; value: string; highlight?: boolean; highlightBackground?: boolean }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-lg border", highlightBackground ? "bg-primary-50 border-primary-100" : "border-transparent px-2")}>
      <div className="flex items-center gap-2.5 text-surface-500">
        <Icon className={cn('h-4 w-4 shrink-0', highlight ? 'text-danger-500' : 'text-surface-400')} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-sm text-right mt-1 sm:mt-0', highlight ? 'text-danger-600 font-bold' : 'text-surface-900 font-semibold')}>
        {value}
      </p>
    </div>
  );
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  CREATE: { icon: FileUp, label: 'Criou o protocolo', color: 'text-success-600 bg-success-50' },
  UPDATE: { icon: Pencil, label: 'Atualizou o protocolo', color: 'text-amber-600 bg-amber-50' },
  VIEW_PROTOCOL: { icon: Eye, label: 'Visualizou o protocolo', color: 'text-info-600 bg-info-50' },
  FORWARD: { icon: Send, label: 'Encaminhou o protocolo', color: 'text-primary-600 bg-primary-50' },
  UPLOAD_ATTACHMENT: { icon: FileUp, label: 'Anexou um arquivo', color: 'text-primary-600 bg-primary-50' },
  RENAME_ATTACHMENT: { icon: Pencil, label: 'Renomeou um anexo', color: 'text-amber-600 bg-amber-50' },
  VIEW_ATTACHMENT: { icon: Eye, label: 'Visualizou um anexo', color: 'text-info-600 bg-info-50' },
  STATUS_CHANGE: { icon: CheckCircle, label: 'Alterou o status', color: 'text-success-600 bg-success-50' },
};

function getActionDetail(activity: ProtocolActivity): string | null {
  const after = activity.payloadAfter as Record<string, unknown> | null;
  const before = activity.payloadBefore as Record<string, unknown> | null;

  if (activity.action === 'UPLOAD_ATTACHMENT' && after?.filename) {
    return `Arquivo: ${after.filename}`;
  }
  if (activity.action === 'RENAME_ATTACHMENT' && before?.filename && after?.filename) {
    return `${before.filename} → ${after.filename}`;
  }
  if (activity.action === 'VIEW_ATTACHMENT' && after?.filename) {
    return `Arquivo: ${after.filename}`;
  }
  if (activity.action === 'UPDATE' && after?.status) {
    return `Status: ${formatStatus(after.status as string)}`;
  }
  return null;
}

function ActivityItem({ activity, isLast }: { activity: ProtocolActivity; isLast: boolean }) {
  const config = ACTION_CONFIG[activity.action] ?? { icon: Activity, label: activity.action, color: 'text-surface-600 bg-surface-100' };
  const IconComp = config.icon;
  const detail = getActionDetail(activity);
  const date = new Date(activity.createdAt);

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-surface-200" />
      )}
      <div className={cn('relative z-10 mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ring-2 ring-white', config.color)}>
        <IconComp className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-sm text-surface-700">
            <span className="font-bold text-surface-900">{activity.actorName}</span>
            {' '}{config.label.toLowerCase()}
          </p>
          <span className="text-xs font-medium text-surface-400 tabular-nums whitespace-nowrap">
            {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {detail && (
          <p className="text-xs text-surface-500 mt-0.5 font-medium">{detail}</p>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title, icon }: { children: React.ReactNode; onClose: () => void; title: string, icon?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
             {icon && <div className="p-2 bg-primary-50 rounded-lg">{icon}</div>}
            <h3 className="text-xl font-bold text-surface-900">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
