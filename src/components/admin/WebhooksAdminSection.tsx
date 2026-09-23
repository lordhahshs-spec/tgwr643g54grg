import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Play, 
  Send, 
  Clock, 
  Zap, 
  ShieldCheck, 
  FileCode, 
  ExternalLink,
  Loader2,
  Server,
  ArrowUpRight,
  Eye,
  Sliders,
  Filter
} from 'lucide-react';
import { 
  webhookMonitorService, 
  RegisteredWebhook, 
  WebhookLogItem 
} from '@/services/webhookMonitorService';
import { toast } from 'sonner';

export const WebhooksAdminSection: React.FC = () => {
  const [webhooks, setWebhooks] = useState<RegisteredWebhook[]>([]);
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCheckingAll, setIsCheckingAll] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  
  // Auto-check interval: 30s, 60s, 120s, or 'manual'
  const [checkIntervalSec, setCheckIntervalSec] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Testing States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<RegisteredWebhook | null>(null);
  const [selectedEventToTest, setSelectedEventToTest] = useState<string>('order.posted');
  const [isSendingPing, setIsSendingPing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    statusCode: number;
    responseTimeMs: number;
    responseBody: string;
    success: boolean;
  } | null>(null);

  // Inspector Modal for Raw Log Payload
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);

  // New Webhook Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newMethod, setNewMethod] = useState<string>('POST');
  const [newDesc, setNewDesc] = useState<string>('');
  const [isSavingNew, setIsSavingNew] = useState<boolean>(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [whs, recentLogs] = await Promise.all([
        webhookMonitorService.getWebhooks(),
        webhookMonitorService.getRecentWebhookLogs(),
      ]);
      setWebhooks(whs);
      setLogs(recentLogs);
      setLastCheckTime(new Date());
    } catch (err) {
      console.error('[WebhooksAdmin] Erro ao carregar dados:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Periodic Auto-Healthcheck
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (checkIntervalSec > 0) {
      timerRef.current = setInterval(async () => {
        if (webhooks.length > 0) {
          const updated = await webhookMonitorService.checkAllWebhooks(webhooks);
          setWebhooks(updated);
          setLastCheckTime(new Date());
        }
      }, checkIntervalSec * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkIntervalSec, webhooks]);

  const handleCheckAllNow = async () => {
    setIsCheckingAll(true);
    try {
      const updated = await webhookMonitorService.checkAllWebhooks(webhooks);
      const recentLogs = await webhookMonitorService.getRecentWebhookLogs();
      setWebhooks(updated);
      setLogs(recentLogs);
      setLastCheckTime(new Date());
      toast.success('Todos os webhooks foram verificados com sucesso!');
    } catch {
      toast.error('Erro ao verificar saúde dos webhooks.');
    } finally {
      setIsCheckingAll(false);
    }
  };

  const handleCheckSingle = async (wh: RegisteredWebhook) => {
    const res = await webhookMonitorService.checkWebhookHealth(wh);
    setWebhooks((prev) =>
      prev.map((item) =>
        item.id === wh.id
          ? {
              ...item,
              last_status: res.status,
              last_status_code: res.statusCode,
              last_response_time_ms: res.responseTimeMs,
              last_checked_at: res.checkedAt,
            }
          : item
      )
    );
    if (res.status === 'online') {
      toast.success(`Webhook "${wh.name}" está ONLINE (${res.responseTimeMs}ms)`);
    } else {
      toast.error(`Webhook "${wh.name}" respondeu status ${res.statusCode} (${res.status.toUpperCase()})`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('URL do webhook copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteWebhook = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este webhook do monitoramento?')) {
      const ok = await webhookMonitorService.deleteWebhook(id);
      if (ok) {
        toast.success('Webhook excluído com sucesso.');
        loadData();
      } else {
        toast.error('Erro ao excluir webhook.');
      }
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) {
      toast.error('Preencha o nome e a URL pública do webhook.');
      return;
    }
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      toast.error('A URL do webhook precisa começar com https://');
      return;
    }

    setIsSavingNew(true);
    const ok = await webhookMonitorService.addWebhook({
      name: newName.trim(),
      url: newUrl.trim(),
      method: newMethod,
      description: newDesc.trim() || undefined,
      service: 'custom',
      is_active: true,
    });
    setIsSavingNew(false);

    if (ok) {
      toast.success('Novo webhook cadastrado e iniciado no monitoramento!');
      setIsAddModalOpen(false);
      setNewName('');
      setNewUrl('');
      setNewDesc('');
      loadData();
    } else {
      toast.error('Erro ao cadastrar webhook.');
    }
  };

  const handleExecuteTestPing = async () => {
    if (!testingWebhook) return;
    setIsSendingPing(true);
    setTestResult(null);

    const testPayload = {
      event: selectedEventToTest,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        id: 'SIMULATED-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        protocol: 'ORD-TEST-' + Math.floor(Math.random() * 1000000),
        status: selectedEventToTest.replace('order.', ''),
        tracking: 'BR' + Math.floor(Math.random() * 100000000) + 'TEST',
        user_id: '30171',
        created_at: new Date().toISOString(),
      },
    };

    try {
      const res = await webhookMonitorService.sendTestPing(testingWebhook, testPayload);
      setTestResult({
        statusCode: res.statusCode,
        responseTimeMs: res.responseTimeMs,
        responseBody: res.responseBody,
        success: res.success,
      });

      // Recarrega os logs para mostrar o evento na auditoria
      webhookMonitorService.getRecentWebhookLogs().then(setLogs);

      if (res.success) {
        toast.success(`Disparo realizado! Status: ${res.statusCode} (${res.responseTimeMs}ms)`);
      } else {
        toast.error(`Falha no disparo: Status ${res.statusCode}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar requisição.');
    } finally {
      setIsSendingPing(false);
    }
  };

  const onlineCount = webhooks.filter((w) => w.last_status === 'online').length;
  const avgResponseTime =
    webhooks.length > 0
      ? Math.round(
          webhooks.reduce((acc, curr) => acc + (curr.last_response_time_ms || 0), 0) / webhooks.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Status dos Webhooks & Métricas */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#090e1c] via-[#0d162d] to-[#090e1c] border border-[#00D287]/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#00D287] tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse" /> Monitoramento em Tempo Real
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Painel de Webhooks do Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditoria, verificação de disponibilidade e recebimento de eventos do Melhor Envio e gateways.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Interval Selector */}
          <div className="flex items-center gap-1.5 bg-[#060a14] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#00D287]" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">Verificação:</span>
            <select
              value={checkIntervalSec}
              onChange={(e) => setCheckIntervalSec(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
            >
              <option value={15} className="bg-slate-900 text-white">A cada 15s</option>
              <option value={30} className="bg-slate-900 text-white">A cada 30s</option>
              <option value={60} className="bg-slate-900 text-white">A cada 1 min</option>
              <option value={120} className="bg-slate-900 text-white">A cada 2 min</option>
              <option value={0} className="bg-slate-900 text-white">Manual</option>
            </select>
          </div>

          <button
            onClick={handleCheckAllNow}
            disabled={isCheckingAll}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin text-[#00D287]' : ''}`} />
            Verificar Agora
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Webhook
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total de Webhooks</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{webhooks.length}</h3>
          <p className="text-[11px] text-slate-500">Endpoints monitorados 24/7</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Endpoints Online</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-[#00D287]">{onlineCount} / {webhooks.length}</h3>
            {onlineCount === webhooks.length && webhooks.length > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D287] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D287]"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">100% de disponibilidade</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Latência Média</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{avgResponseTime} ms</h3>
          <p className="text-[11px] text-slate-500">Tempo médio de resposta HTTP</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Eventos Recebidos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{logs.length}</h3>
          <p className="text-[11px] text-slate-500">Notificações auditadas no banco</p>
        </div>
      </div>

      {/* LISTA DE WEBHOOKS ATIVOS */}
      <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#00D287]" />
              Webhooks Cadastrados & Status em Tempo Real
            </h3>
            <p className="text-xs text-slate-400">
              O sistema verifica periodicamente a resposta HTTP 2xx e a latência de cada endpoint.
            </p>
          </div>

          <span className="text-[11px] text-slate-500">
            Última checagem: {lastCheckTime.toLocaleTimeString('pt-BR')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2">
          {webhooks.map((wh) => {
            const isOnline = wh.last_status === 'online';
            const isWarning = wh.last_status === 'warning';

            return (
              <div
                key={wh.id}
                className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{wh.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-slate-300">
                      {wh.method}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                        isOnline
                          ? 'bg-emerald-500/20 text-[#00D287] border border-emerald-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-[#00D287] animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                      />
                      {wh.last_status.toUpperCase()}
                    </span>

                    {wh.last_status_code > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        HTTP {wh.last_status_code}
                      </span>
                    )}

                    {wh.last_response_time_ms > 0 && (
                      <span className="text-[10px] text-slate-400">
                        • {wh.last_response_time_ms} ms
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10 truncate max-w-xl">
                      {wh.url}
                    </code>
                    <button
                      onClick={() => handleCopy(wh.url, wh.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copiar URL"
                    >
                      {copiedId === wh.id ? <Check className="w-3.5 h-3.5 text-[#00D287]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {wh.description && (
                    <p className="text-[11px] text-slate-400">{wh.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCheckSingle(wh)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                    title="Verificar status agora"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ping
                  </button>

                  <button
                    onClick={() => {
                      setTestingWebhook(wh);
                      setTestResult(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] border border-[#00D287]/30 text-xs font-bold flex items-center gap-1.5"
                    title="Disparar simulador de webhook"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Simular Disparo
                  </button>

                  {wh.service !== 'melhor_envio' && (
                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="Excluir webhook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTÓRICO DE EVENTOS RECEBIDOS (LOGS) */}
      <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#00D287]" />
              Eventos Recebidos em Tempo Real (Auditoria)
            </h3>
            <p className="text-xs text-slate-400">
              Histórico das notificações enviadas pelo Melhor Envio e processadas no CellHub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => webhookMonitorService.getRecentWebhookLogs().then(setLogs)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar Logs
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              Nenhum evento registrado ainda. Quando o Melhor Envio disparar atualizações de etiquetas, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="pb-3">Data / Hora</th>
                  <th className="pb-3">Evento</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Detalhes</th>
                  <th className="pb-3 text-right">Inspecionar Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30">
                        {log.event}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'success' || log.status === 'processed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 max-w-sm truncate">
                      {log.message || '-'}
                    </td>
                    <td className="py-3 text-right">
                      {log.payload ? (
                        <button
                          onClick={() => setSelectedLogPayload(log.payload)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Ver JSON
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: SIMULADOR DE DISPARO DE TESTE */}
      {testingWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#090e1c] border border-[#00D287]/30 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-[#00D287]" />
                <h3 className="text-sm font-bold text-white">Simulador de Disparo de Webhook</h3>
              </div>
              <button
                onClick={() => setTestingWebhook(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Destino do Disparo</label>
                <code className="block bg-slate-950 p-2.5 rounded-xl border border-white/10 text-white font-mono text-[11px]">
                  {testingWebhook.url}
                </code>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tipo de Evento para Simulação</label>
                <select
                  value={selectedEventToTest}
                  onChange={(e) => setSelectedEventToTest(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-[#00D287]"
                >
                  <option value="order.posted">order.posted (Etiqueta postada na agência)</option>
                  <option value="order.delivered">order.delivered (Mercadoria entregue ao comprador)</option>
                  <option value="order.released">order.released (Etiqueta paga e disponível)</option>
                  <option value="order.generated">order.generated (Etiqueta gerada)</option>
                  <option value="order.cancelled">order.cancelled (Envio cancelado)</option>
                  <option value="order.undelivered">order.undelivered (Destinatário ausente / não entregue)</option>
                </select>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  testResult.success
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Resultado do Teste: HTTP {testResult.statusCode}</span>
                    <span>{testResult.responseTimeMs} ms</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-black/60 p-2.5 rounded-xl overflow-x-auto text-slate-200 max-h-32">
                    {testResult.responseBody || '(Resposta vazia)'}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setTestingWebhook(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleExecuteTestPing}
                disabled={isSendingPing}
                className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 disabled:opacity-50"
              >
                {isSendingPing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enviando POST...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Enviar Payload de Teste
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO DE NOVO WEBHOOK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <form onSubmit={handleCreateWebhook} className="w-full max-w-lg bg-[#090e1c] border border-[#00D287]/30 rounded-3xl p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00D287]" />
                <h3 className="text-sm font-bold text-white">Cadastrar Novo Webhook</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome do Webhook *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Gateway Pagamento Pix Webhook"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#00D287]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">URL Pública do Webhook *</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://cellhub.shop/api/webhooks/meu-webhook"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-mono outline-none focus:border-[#00D287]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Método HTTP</label>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#00D287]"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Finalidade do endpoint..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#00D287]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingNew}
                className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black shadow-md shadow-[#00D287]/20 disabled:opacity-50"
              >
                {isSavingNew ? 'Salvando...' : 'Cadastrar Webhook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: INSPECIONAR JSON DO PAYLOAD */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#090e1c] border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#00D287]" />
                <h3 className="text-sm font-bold text-white">Payload do Webhook Recebido (JSON)</h3>
              </div>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <pre className="text-xs font-mono bg-black/70 p-4 rounded-2xl overflow-x-auto text-emerald-400 max-h-96 border border-white/5">
              {JSON.stringify(selectedLogPayload, null, 2)}
            </pre>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLogPayload, null, 2));
                  toast.success('JSON copiado!');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar JSON
              </button>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-2 rounded-xl bg-[#00D287] text-slate-950 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
