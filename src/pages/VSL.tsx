import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Star,
  TrendingUp,
  Lock,
  Sparkles,
  Smartphone,
  Cpu,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const VSLPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoDuration] = useState<number>(384); // ~6:24 minutes
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showDelayedCta, setShowDelayedCta] = useState<boolean>(true); // Accessible right away for best UX

  // Simulated video playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= videoDuration) {
            setIsPlaying(false);
            return videoDuration;
          }
          const next = prev + 1;
          setProgress((next / videoDuration) * 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoDuration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const handleEnterPlatform = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 selection:bg-[#00D287]/30 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Urgent Bar */}
      <div className="bg-gradient-to-r from-[#00D287]/20 via-[#00D287]/30 to-[#00D287]/20 border-b border-[#00D287]/30 py-2 text-center px-4">
        <p className="text-[11px] sm:text-xs font-bold text-white flex items-center justify-center gap-2 tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#00D287] animate-ping" />
          Apresentação Oficial para Lojistas e Técnicos de Celular
        </p>
      </div>

      {/* Main Header */}
      <header className="h-16 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00D287] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#00D287]/30">
            <Zap className="w-4 h-4 text-slate-950 fill-current" />
          </div>
          <span className="font-black text-base tracking-tight text-white">
            Aurus<span className="text-[#00D287]">Pay</span>
          </span>
        </div>

        <Button
          onClick={handleEnterPlatform}
          variant="outline"
          size="sm"
          className="text-xs bg-slate-950 border-white/10 hover:border-[#00D287]/50 hover:bg-[#00D287]/10 text-slate-200 hover:text-white transition-all rounded-xl"
        >
          <span>Pular para o Sistema</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#00D287]" />
        </Button>
      </header>

      {/* Hero Section / VSL */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center">
        {/* Pre-headline Pill */}
        <Badge className="bg-[#00D287]/15 text-[#00D287] border-[#00D287]/30 text-[11px] px-3 py-1 font-semibold mb-4 rounded-full">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Oportunidade de Alto Faturamento
        </Badge>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          Como Destravar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D287] via-emerald-300 to-teal-200">Vendas de Android Diárias</span> e Multiplicar o Lucro da Sua Loja
        </h1>

        {/* Subhead */}
        <p className="text-sm sm:text-base text-slate-300 mt-4 max-w-2xl leading-relaxed">
          Assista à demonstração em vídeo para entender como o simulador de vendas, esquemas elétricos e treinamentos técnicos colocam seu negócio em outro patamar.
        </p>

        {/* VSL Video Container */}
        <div className="w-full mt-8 relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a101f] to-[#050811] border-2 border-[#00D287]/40 shadow-2xl shadow-[#00D287]/10">
          <div 
            onClick={togglePlay}
            className="relative aspect-video w-full bg-slate-950 cursor-pointer group flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background Graphic Grid */}
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `radial-gradient(circle, #00D287 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Video Mock Graphics / Poster */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-emerald-950/40" />

            {/* Simulated Animated Elements */}
            <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00D287] text-slate-950 flex items-center justify-center shadow-xl shadow-[#00D287]/40 transition-transform duration-300 ${isPlaying ? 'scale-90 opacity-0 group-hover:opacity-100' : 'scale-100 group-hover:scale-110'}`}>
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </div>

              {!isPlaying && (
                <div className="mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] bg-black/60 px-3 py-1 rounded-full border border-[#00D287]/30 backdrop-blur-md">
                    Clique Para Assistir ao Vídeo
                  </span>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    🔊 Duração rápida: 6 minutos • Ligue o som
                  </p>
                </div>
              )}
            </div>

            {/* Live Playback Badge & Sound Status */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-[11px] text-white backdrop-blur-md font-mono">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                {isPlaying ? 'REPRODUZINDO' : 'PAUSADO'}
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 rounded-lg bg-black/70 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md"
                title={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00D287]" />}
              </button>
            </div>

            {/* Video Controls Bottom Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col gap-2 z-20">
              {/* Progress Slider */}
              <div 
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newPercent = (clickX / rect.width) * 100;
                  setProgress(newPercent);
                  setCurrentTime((newPercent / 100) * videoDuration);
                }}
              >
                <div 
                  className="h-full bg-[#00D287] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <div className="flex items-center gap-3">
                  <span>{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
                  <span className="text-[#00D287] font-sans font-semibold hidden sm:inline">
                    Simulador & Ferramentas em Ação
                  </span>
                </div>
                <span>Full HD 1080p</span>
              </div>
            </div>
          </div>
        </div>

        {/* Big High-Converting Call To Action Button */}
        {showDelayedCta && (
          <div className="w-full max-w-xl mt-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <button
              onClick={handleEnterPlatform}
              className="group relative w-full py-4 px-6 sm:px-8 rounded-2xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-base sm:text-lg tracking-tight shadow-xl shadow-[#00D287]/30 hover:shadow-[#00D287]/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
            >
              <span>ACESSAR A PLATAFORMA AGORA</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-3">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#00D287]" /> Acesso Imediato
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" /> Conexão Segura
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#00D287]" /> 100% Funcional
              </span>
            </div>
          </div>
        )}

        {/* What you get inside the platform */}
        <div className="w-full mt-14 pt-10 border-t border-white/5">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            O Que Você Terá Acesso Dentro do Ecossistema:
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-8">
            Tudo o que sua assistência técnica e loja precisa em um único lugar centralizado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mb-3">
                <Smartphone className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Simulador Venda Android</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integração com cálculo de parcelas e motor oficial para fechar vendas no balcão.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mb-3">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Cursos & Bancada</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Treinamentos de manutenção, troca de vidro, microeletrônica e técnicas comerciais.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Esquemas Elétricos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Boardviews interativos com pontos de teste de voltagem e condução reversa.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mb-3">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Trade-In & Margem</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculadora de celular usado na troca e simulação precisa de margem líquida.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof Snippets */}
        <div className="w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            {
              name: 'Marcos Almeida',
              role: 'Lojista em Campinas - SP',
              text: 'Comecei a usar o simulador no atendimento e fechamos 14 aparelhos na primeira semana. A plataforma é direta e sem enrolação.',
              rating: 5,
            },
            {
              name: 'Rodrigo Fontes',
              role: 'Técnico Especialista Mobile',
              text: 'Os esquemas elétricos e a parte de cursos economizam horas de bancada. Identifico curtos na linha principal em minutos.',
              rating: 5,
            },
            {
              name: 'Fernanda Martins',
              role: 'Gerente Comercial',
              text: 'A ferramenta de Trade-In fez nossos clientes aceitarem a troca do usado na hora. Aumentou o ticket médio da loja.',
              rating: 5,
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#080c17] border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{item.text}"
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-white block">{item.name}</span>
                <span className="text-[10px] text-slate-500">{item.role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Final Floating Action Button on Bottom */}
        <div className="mt-10 mb-6">
          <Button
            onClick={handleEnterPlatform}
            className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-extrabold text-sm h-11 px-8 rounded-xl shadow-lg shadow-[#00D287]/20"
          >
            Entrar no Sistema Agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AurusPay • Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default VSLPage;
