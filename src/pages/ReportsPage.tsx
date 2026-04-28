import { useState } from 'react';
import { reportsApi, triggerPdfDownload } from '@/api/reports.api';
import { useQuery } from '@tanstack/react-query';
import { sectorsApi } from '@/api/sectors.api';

import { extractErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { formatStatus } from '@/lib/format';
import { Loader2, FileDown, Calendar, ArrowRight } from 'lucide-react';
import type { RequestStatus } from '@/types/request.types';

const ALL_STATUSES: RequestStatus[] = ['PROTOCOLADO', 'RECEBIDO_PELO_SETOR', 'EM_ANALISE', 'PENDENTE_DOCUMENTO', 'DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'];

export function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [requestTypeId] = useState('');
  const [status, setStatus] = useState('');

  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => sectorsApi.list() });

  async function handleExport() {
    setLoading(true);
    try {
      const blob = await reportsApi.downloadPdf({
        from: from || undefined, to: to || undefined,
        sectorCode: sectorCode || undefined, requestTypeId: requestTypeId || undefined,
        status: status || undefined,
      });
      triggerPdfDownload(blob, `protocolos-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Relatório gerado com sucesso!');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Relatórios</h1>
          <p className="text-surface-500 text-sm mt-1.5 font-medium">Exporte relatórios em PDF dos protocolos filtrados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-200/60 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900">Período e Filtros</h2>
            <p className="text-xs font-medium text-surface-500">Defina os parâmetros para geração do documento</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Data Início</label>
              <input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Data Fim</label>
              <input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Setor Responsável</label>
              <select 
                value={sectorCode} 
                onChange={(e) => setSectorCode(e.target.value)} 
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              >
                <option value="">Todos os setores</option>
                {sectors?.map((s) => <option key={s.id} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">Situação (Status)</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full rounded-xl border border-surface-200/80 bg-surface-50/50 px-3.5 py-2.5 text-sm font-medium text-surface-900 outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all hover:border-surface-300"
              >
                <option value="">Todos os status</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
              </select>
            </div>
          </div>
          
          <div className="pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-medium text-surface-500 flex-1">
              O relatório será gerado no formato PDF contendo a listagem dos protocolos que atendem aos filtros acima.
            </p>
            <button 
              onClick={handleExport} 
              disabled={loading} 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:shadow-md hover:bg-primary-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm transition-all"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando Documento...</>
              ) : (
                <><FileDown className="h-4 w-4" /> Exportar Relatório <ArrowRight className="h-4 w-4 ml-1 opacity-70" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
