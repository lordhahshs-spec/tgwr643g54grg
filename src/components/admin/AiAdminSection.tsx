import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Activity, 
  DollarSign, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Filter, 
  Search,
  Zap,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { tradeinAiService } from '@/services/tradeinAiService';
import { AiConfiguration, AiUsageLog } from '@/types/tradeinAi';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface AiAdminSectionProps {
  users: UserAccount[];
}

export const AiAdminSection: React.FC<AiAdminSectionProps> = ({ users }) => {
  const [subTab, setSubTab] = useState<'config' | 'logs' | 'users'>('config');
  const [config, setConfig] = useState<AiConfiguration | null>(null);
  const [logs, setLogs] = useState<AiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Masks
  const [showFreeKey, setShowFreeKey] = useState(false);
  const [showPaidKey, setShowPaidKey] = useState(false);
  const [freeKeyInput, setFreeKeyInput] = useState('');
  const [paidKeyInput, setPaidKeyInput] = useState('');

  // Filters
  const [searchUser, setSearchUser] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'blocked_quota' | 'error'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfg, logsData] = await Promise.all([
        tradeinAiService.getAdminConfig(),
        tradeinAiService.getUsageLogs(150)
      ]);
      setConfig(cfg);
      setLogs(logsData);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados da IA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const payload: Partial<AiConfiguration> = {
        free_tier_active: config.free_tier_active,
        free_tier_provider: config.free_tier_provider,
        free_tier_model: config.free_tier_model,
        free_tier_limit: Number(config.free_tier_limit) || 20,
        free_tier_period: config.free_tier_period,
        paid_tier_active: config.paid_tier_active,
        paid_tier_provider: config.paid_tier_provider,
        paid_tier_model: config.paid_tier_model,
        paid_tier_monthly_price: Number(config.paid_tier_monthly_price) || 9.90
      };

      // Se o admin editou alguma das chaves
      if (freeKeyInput.trim()) {
        (payload as any).free_tier_api_key = freeKeyInput.trim();
      }
      if (paidKeyInput.trim()) {
        (payload as any).paid_tier_api_key = paidKeyInput.trim();
      }

      const ok = await tradeinAiService.saveAdminConfig(payload);
      if (ok) {
        toast.success('Configurações da CellHub IA salvas com sucesso!');
        setFreeKeyInput('');
        setPaidKeyInput('');
        loadData();
      } else {
        toast.error('Erro ao salvar configurações.');
      }
    } catch (err) {
      toast.error('Erro ao processar alteração.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalAnalyses = logs.filter(l => l.status === 'success').length;
  const freeAnalyses = logs.filter(l => l.status === 'success' && l.api_tier === 'free').length;
  const paidAnalyses = logs.filter(l => l.status === 'success' && l.api_tier === 'paid').length;
  const blockedQuotaCount = logs.filter(l => l.status === 'blocked_quota').length;
  const totalCostUsd = logs.reduce((acc, l) => acc + (Number(l.estimated_cost) || 0), 0);

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    if (tierFilter !== 'all' && log.api_tier !== tierFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchUser) {
      const q = searchUser.toLowerCase();
      const user = users.find(u => u.id === log.user_id);
      const matchEmail = (user?.email || '').toLowerCase().includes(q);
      const matchCompany = (user?.companyName || user?.tradeName || '').toLowerCase().includes(q);
      const matchUserId = log.user_id.toLowerCase().includes(q);
      if (!matchEmail && !matchCompany && !matchUserId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total de Análises</span>
            <div className="text-xl sm:text-2xl font-black text-white">{totalAnalyses}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">API Gratuita (Consumo)</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{freeAnalyses}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">API Paga (Assinantes)</span>
            <div className="text-xl sm:text-2xl font-black text-purple-400">{paidAnalyses}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Custo Estimado IA</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              ${totalCostUsd.toFixed(4)} <span className="text-xs text-slate-400 font-normal">USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSubTab('config')}
          className={`text-xs font-bold rounded-xl h-9 px-4 ${
            subTab === 'config'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 mr-1.5" /> Configurações das APIs
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSubTab('logs')}
          className={`text-xs font-bold rounded-xl h-9 px-4 ${
            subTab === 'logs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 mr-1.5" /> Registro de Consumo & Logs
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSubTab('users')}
          className={`text-xs font-bold rounded-xl h-9 px-4 ${
            subTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Gestão de Acesso dos Lojistas
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
          Carregando dados da CellHub IA...
        </div>
      ) : subTab === 'config' && config ? (
        /* CONFIGURATION TAB */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. API GRATUITA CARD */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">API GRATUITA (Padrão para Todos)</h3>
                    <p className="text-[11px] text-slate-400">Primeira opção para todos os lojistas</p>
                  </div>
                </div>

                <Badge className={config.free_tier_active ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}>
                  {config.free_tier_active ? 'ATIVA' : 'INATIVA'}
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Status da API Gratuita:</label>
                  <Switch
                    checked={config.free_tier_active}
                    onCheckedChange={(checked) => setConfig({ ...config, free_tier_active: checked })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Modelo de IA:</label>
                  <Input
                    value={config.free_tier_model}
                    onChange={(e) => setConfig({ ...config, free_tier_model: e.target.value })}
                    className="bg-[#1e293b] border-slate-700 text-xs text-white rounded-xl h-9 font-mono"
                    placeholder="gemini-1.5-flash"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium block">Limite de Análises:</label>
                    <Input
                      type="number"
                      value={config.free_tier_limit}
                      onChange={(e) => setConfig({ ...config, free_tier_limit: Number(e.target.value) || 0 })}
                      className="bg-[#1e293b] border-slate-700 text-xs text-emerald-400 font-bold rounded-xl h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium block">Período de Renovação:</label>
                    <select
                      value={config.free_tier_period}
                      onChange={(e) => setConfig({ ...config, free_tier_period: e.target.value as any })}
                      className="w-full bg-[#1e293b] border border-slate-700 text-xs rounded-xl p-2 text-white h-9 focus:border-blue-500 outline-none"
                    >
                      <option value="daily">Diário (24 horas)</option>
                      <option value="monthly">Mensal</option>
                      <option value="rolling">Rolling</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-slate-300 font-medium block">API Key (Armazenada no Backend):</label>
                  <div className="relative">
                    <Input
                      type={showFreeKey ? 'text' : 'password'}
                      value={freeKeyInput}
                      onChange={(e) => setFreeKeyInput(e.target.value)}
                      placeholder="•••••••••••••••••••••••••••••••• (Inalterada)"
                      className="bg-[#1e293b] border-slate-700 text-xs text-white font-mono rounded-xl h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFreeKey(!showFreeKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showFreeKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500">Deixe em branco para manter a chave atual cadastrada.</span>
                </div>
              </div>
            </div>

            {/* 2. API PAGA CARD */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">API PAGA (Fallback Autorizado)</h3>
                    <p className="text-[11px] text-slate-400">Acionada após limite gratuito para assinantes</p>
                  </div>
                </div>

                <Badge className={config.paid_tier_active ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}>
                  {config.paid_tier_active ? 'ATIVA' : 'INATIVA'}
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Status da API Paga:</label>
                  <Switch
                    checked={config.paid_tier_active}
                    onCheckedChange={(checked) => setConfig({ ...config, paid_tier_active: checked })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Modelo de IA Avançado:</label>
                  <Input
                    value={config.paid_tier_model}
                    onChange={(e) => setConfig({ ...config, paid_tier_model: e.target.value })}
                    className="bg-[#1e293b] border-slate-700 text-xs text-white rounded-xl h-9 font-mono"
                    placeholder="gemini-1.5-pro"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Valor da Assinatura Mensal (R$):</label>
                  <Input
                    type="number"
                    step="0.10"
                    value={config.paid_tier_monthly_price}
                    onChange={(e) => setConfig({ ...config, paid_tier_monthly_price: Number(e.target.value) || 0 })}
                    className="bg-[#1e293b] border-slate-700 text-xs text-purple-400 font-bold rounded-xl h-9"
                  />
                  <span className="text-[10px] text-slate-500">Valor planejado para o checkout de R$ 9,90/mês.</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-slate-300 font-medium block">API Key (Armazenada no Backend):</label>
                  <div className="relative">
                    <Input
                      type={showPaidKey ? 'text' : 'password'}
                      value={paidKeyInput}
                      onChange={(e) => setPaidKeyInput(e.target.value)}
                      placeholder="•••••••••••••••••••••••••••••••• (Inalterada)"
                      className="bg-[#1e293b] border-slate-700 text-xs text-white font-mono rounded-xl h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPaidKey(!showPaidKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPaidKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500">Deixe em branco para manter a chave atual cadastrada.</span>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações de IA'}
            </Button>
          </div>
        </div>
      ) : subTab === 'logs' ? (
        /* LOGS TAB */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Filtrar por lojista, empresa ou ID..."
                className="bg-[#1e293b] border-slate-700 pl-9 text-xs rounded-xl h-9 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-[#1e293b] border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-white h-9 outline-none"
              >
                <option value="all">Todas as APIs</option>
                <option value="free">API Gratuita</option>
                <option value="paid">API Paga</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#1e293b] border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-white h-9 outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="success">Sucesso</option>
                <option value="blocked_quota">Bloqueio de Quota</option>
                <option value="error">Erro Técnico</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#0f172a]">
            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Nenhum registro de uso encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1e293b]/70 text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Data / Hora</th>
                      <th className="p-3">Lojista</th>
                      <th className="p-3">API / Tier</th>
                      <th className="p-3">Modelo</th>
                      <th className="p-3">Tokens</th>
                      <th className="p-3">Custo Est.</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.map(log => {
                      const user = users.find(u => u.id === log.user_id);
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-white block truncate max-w-[150px]">
                              {user?.companyName || user?.tradeName || 'Lojista'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {user?.email || log.user_id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge className={
                              log.api_tier === 'paid' 
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }>
                              {log.api_tier === 'paid' ? 'API PAGA' : 'API GRATUITA'}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            {log.model}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {log.tokens_input + log.tokens_output}
                          </td>
                          <td className="p-3 font-mono text-emerald-400 text-[11px] whitespace-nowrap">
                            ${Number(log.estimated_cost).toFixed(5)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {log.status === 'success' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Sucesso</Badge>
                            ) : log.status === 'rejected' || log.status === 'rejected_non_phone' ? (
                              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20" title={log.error_message || 'Foto rejeitada pela IA'}>
                                Foto Rejeitada
                              </Badge>
                            ) : log.status === 'blocked_quota' ? (
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Cota Excedida</Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Erro</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* USERS ACCESS MANAGEMENT */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">Controle de Acesso à IA Paga por Lojista (Teste & Liberação Manual)</h3>
            <p className="text-xs text-slate-400">
              Permite ao Master Admin habilitar o acesso de teste à API Paga para lojistas específicos enquanto o sistema de cobrança recorrente não está conectado.
            </p>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#0f172a]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1e293b]/70 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Lojista / Empresa</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Análises Realizadas</th>
                  <th className="p-3 text-right">Acesso à IA Paga (Teste)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => {
                  const userLogs = logs.filter(l => l.user_id === u.id && l.status === 'success');
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-white">
                        {u.companyName || u.tradeName || u.ownerName || 'Lojista'}
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="p-3 text-slate-300 font-medium">
                        <span className="text-blue-400 font-bold">{userLogs.length}</span> diagnósticos
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const ok = await tradeinAiService.toggleUserPaidAccess(u.id, true);
                            if (ok) toast.success(`Acesso à IA Paga liberado para ${u.email}`);
                          }}
                          className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-bold rounded-lg h-7 px-3"
                        >
                          Liberar Acesso Pago
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
