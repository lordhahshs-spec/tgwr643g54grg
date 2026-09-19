import React from 'react';
import { ShieldAlert, MessageCircle, LogOut, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAccount, leadAuthService } from '@/services/leadAuthService';

interface BannedScreenProps {
  user: UserAccount;
  onLogout: () => void;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({ user, onLogout }) => {
  const whatsappNumber = "5511999999999";
  const whatsappText = encodeURIComponent(
    `Olá, sou o responsável pela empresa ${user.companyName} (CNPJ: ${user.cnpj}) e recebi um aviso de suspensão de acesso na plataforma AurusPay. Gostaria de verificar a situação da minha conta.`
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050811]/98 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#0c101c] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-rose-950/60 relative overflow-hidden">
        {/* Glowing red accent background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Shield Icon */}
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-950/50">
            <ShieldAlert className="w-10 h-10 stroke-[2.2] animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-800/60 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso Suspenso</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Conta Bloqueada Pela Administração
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            O acesso da sua empresa ao ecossistema AurusPay foi interrompido e a plataforma foi bloqueada preventivamente.
          </p>

          {/* Account Details Box */}
          <div className="my-5 p-4 rounded-2xl bg-slate-950/90 border border-white/5 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-1.5">
              <span>Empresa:</span>
              <strong className="text-white">{user.companyName}</strong>
            </div>

            <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-1.5">
              <span>Responsável:</span>
              <span className="text-slate-200">{user.ownerName}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-1.5">
              <span>CNPJ:</span>
              <span className="text-rose-300 font-mono font-semibold">{user.cnpj}</span>
            </div>

            <div className="pt-1">
              <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                Motivo do Bloqueio:
              </span>
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs font-medium leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>
                  {user.banReason || 'Irregularidade cadastral ou descumprimento das diretrizes comerciais da AurusPay. Entre em contato com a equipe de compliance.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <a
              href={`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/20 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Falar com o Suporte (WhatsApp)</span>
            </a>

            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs h-10 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Sair da Conta</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
