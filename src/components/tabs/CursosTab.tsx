import React, { useState } from 'react';
import {
  GraduationCap,
  Play,
  Clock,
  BookOpen,
  CheckCircle2,
  Download,
  Star,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  category: 'tecnico' | 'vendas' | 'oca' | 'software';
  categoryLabel: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  hours: number;
  modulesCount: number;
  rating: number;
  studentsCount: number;
  description: string;
  highlight: string;
  instructor: string;
  instructorRole: string;
  tags: string[];
  modules: {
    title: string;
    duration: string;
    lessons: string[];
  }[];
}

const COURSES_DATA: Course[] = [
  {
    id: '1',
    title: 'Manutenção de Smartphones Android do Zero ao Avançado',
    category: 'tecnico',
    categoryLabel: 'Hardware & Bancada',
    level: 'Iniciante',
    hours: 45,
    modulesCount: 8,
    rating: 4.9,
    studentsCount: 3420,
    description: 'Aprenda diagnóstico preciso de placas-mãe, micro soldagem, substituição de conectores Type-C, troca de telas e interpretação de esquemas elétricos em aparelhos Samsung, Motorola e Xiaomi.',
    highlight: 'Mais vendido para técnicos de bancada',
    instructor: 'Prof. Carlos Eduardo',
    instructorRole: 'Especialista em Microeletrônica Mobile há 14 anos',
    tags: ['Micro Solda', 'Placa Android', 'Conectores', 'Multímetro'],
    modules: [
      {
        title: 'Módulo 1: Montagem de Bancada e Ferramentas Profissionais',
        duration: '4h 30m',
        lessons: ['Estações de retrabalho e ferros de solda recomendados', 'Uso seguro de ESD e proteção antiestática', 'Multímetro digital e fonte de bancada ajustável'],
      },
      {
        title: 'Módulo 2: Desmontagem Segura e Troca de Periféricos',
        duration: '6h 15m',
        lessons: ['Remoção de tampas traseiras sem quebra (vidro e plástico)', 'Troca de baterias blindadas com segurança', 'Substituição de câmeras, flex e subplacas'],
      },
      {
        title: 'Módulo 3: Solda SMD e Troca de Conectores de Carga',
        duration: '8h 00m',
        lessons: ['Fluxos de solda e ligas de estanho ideais', 'Técnica de remoção sem agredir componentes vizinhos', 'Reconstrução de trilhas rompidas com fio de jumper'],
      },
      {
        title: 'Módulo 4: Diagnóstico com Fonte de Bancada (Consumos)',
        duration: '7h 20m',
        lessons: ['Identificando curto total antes do power', 'Consumos secundários e boot loop', 'Linhas VCC_MAIN e VDD_BATT'],
      },
    ],
  },
  {
    id: '2',
    title: 'Técnicas de Vendas de Celulares & Fechamento no Balcão e WhatsApp',
    category: 'vendas',
    categoryLabel: 'Vendas & Negociação',
    level: 'Iniciante',
    hours: 22,
    modulesCount: 5,
    rating: 4.95,
    studentsCount: 2150,
    description: 'Metodologia prática para dobrar as vendas de smartphones novos e seminovos, quebrar objeções de preço, simular parcelamento com o Aurus e criar fidelização pós-venda.',
    highlight: 'Focado em dobrar seu faturamento',
    instructor: 'Renata Vasconcelos',
    instructorRole: 'Consultora de Vendas no Varejo de Tecnologia',
    tags: ['Script de Vendas', 'Objeção de Preço', 'WhatsApp Vendedor', 'Garantia'],
    modules: [
      {
        title: 'Módulo 1: Abordagem de Alto Impacto na Loja e no Chat',
        duration: '3h 45m',
        lessons: ['Gatilhos mentais para vendas de smartphones', 'Como qualificar o perfil do cliente em 2 minutos', 'Apresentação do aparelho com foco no benefício'],
      },
      {
        title: 'Módulo 2: O Poder do Simulador de Financiamento',
        duration: '4h 20m',
        lessons: ['Como utilizar a simulação Aurus para fechar na hora', 'Apresentação da parcela diária/mensal que cabe no bolso', 'Eliminando o medo de crédito negado'],
      },
      {
        title: 'Módulo 3: Venda de Acessórios e Garantia Estendida',
        duration: '5h 10m',
        lessons: ['Técnica do combo (capa, película, carregador turbo)', 'Como vender seguros e proteções sem parecer chato', 'Margem líquida de lucro em periféricos'],
      },
    ],
  },
  {
    id: '3',
    title: 'Troca de Vidro e Laminação OCA Profissional',
    category: 'oca',
    categoryLabel: 'Laminação & Telas',
    level: 'Intermediário',
    hours: 32,
    modulesCount: 6,
    rating: 4.85,
    studentsCount: 1890,
    description: 'Domine a recuperação de telas originais mantendo o touch e display 100% de fábrica. Aplicação de filme OCA, uso de separadora de tela e máquina de tira-bolhas sem manchas.',
    highlight: 'Margem de lucro superior a 300%',
    instructor: 'Leandro Rossi',
    instructorRole: 'Técnico Especialista em Recondicionamento de Displays',
    tags: ['Cola OCA', 'Separadora a Vácuo', 'Tira Bolhas', 'Aparelhos Curvos'],
    modules: [
      {
        title: 'Módulo 1: Teoria dos Displays (IPS, AMOLED, OLED)',
        duration: '3h 30m',
        lessons: ['Diferenças construtivas e sensibilidade térmica', 'Quando vale a pena recondicionar o vidro', 'Calculando o lucro por tela'],
      },
      {
        title: 'Módulo 2: Separação do Vidro Quebrado com Fio de Aço',
        duration: '6h 00m',
        lessons: ['Temperatura ideal na separadora de LCD', 'Técnica de corte do fio molibdênio sem riscar o polarizador', 'Limpeza da cola velha residual'],
      },
      {
        title: 'Módulo 3: Laminação e Autoclave sem Bolhas',
        duration: '7h 15m',
        lessons: ['Alinhamento manual e moldes metálicos de precisão', 'Ajuste de pressão e vácuo na máquina laminadora', 'Curando bolhas persistentes na autoclave'],
      },
    ],
  },
  {
    id: '4',
    title: 'Software Android, Flashing e Recuperação de Sistema',
    category: 'software',
    categoryLabel: 'Software & Desbloqueio',
    level: 'Avançado',
    hours: 28,
    modulesCount: 6,
    rating: 4.88,
    studentsCount: 1450,
    description: 'Restauração de aparelhos travados no logo, reinstalação de firmwares oficiais (Odin Samsung, SP Flash Tool, Fastboot Xiaomi), reparo de IMEI nulo e correções de segurança.',
    highlight: 'Resolução de problemas de software',
    instructor: 'Marcos Vinicius',
    instructorRole: 'Desenvolvedor e Técnico Sênior em Android OS',
    tags: ['Odin Samsung', 'Fastboot', 'FRP', 'Firmware Stock'],
    modules: [
      {
        title: 'Módulo 1: Drivers USB e Comunicação com Computador',
        duration: '3h 10m',
        lessons: ['Instalação correta de drivers ADB e Fastboot', 'Resolução de problemas de porta COM e cabos de dados', 'Identificação correta da ROM de cada modelo'],
      },
      {
        title: 'Módulo 2: Reinstalação de Firmware Samsung e Motorola',
        duration: '5h 45m',
        lessons: ['Uso do Odin 3 para recuperação de 4 arquivos (BL, AP, CP, CSC)', 'Rescue and Smart Assistant da Motorola', 'Backup de dados de usuários antes do flash'],
      },
    ],
  },
];

export const CursosTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<string>('Aula 1: Conceitos Iniciais e Boas Práticas');
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  const filteredCourses = COURSES_DATA.filter((course) => {
    const matchesCategory = selectedCategory === 'todos' || course.category === selectedCategory;
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleLessonDone = (lessonName: string) => {
    setCompletedLessons(prev => ({
      ...prev,
      [lessonName]: !prev[lessonName]
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d162b] via-[#091f38] to-[#0d162b] border border-cyan-500/25 p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs px-3 py-0.5">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />
              Academia SmartTech Pro
            </Badge>
            <span className="text-xs text-slate-400">Certificados Reconhecidos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Cursos de Manutenção & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Vendas de Celulares</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed">
            Capacitação técnica para técnicos de bancada e consultores comerciais. Aprenda micro soldagem, recuperação de telas OCA e técnicas persuasivas para fechar vendas de smartphones com facilidade.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-xl font-extrabold text-cyan-400">120h+</div>
              <div className="text-xs text-slate-400">Conteúdo Prático</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-xl font-extrabold text-emerald-400">8.900+</div>
              <div className="text-xs text-slate-400">Alunos Formados</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-xl font-extrabold text-blue-400">100%</div>
              <div className="text-xs text-slate-400">Com Certificado</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-xl font-extrabold text-amber-400">Suporte VIP</div>
              <div className="text-xs text-slate-400">Grupo no WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos os Cursos' },
            { id: 'tecnico', label: 'Hardware & Bancada' },
            { id: 'vendas', label: 'Vendas & Negociação' },
            { id: 'oca', label: 'Telas & Laminação OCA' },
            { id: 'software', label: 'Software & Flash' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por técnica ou assunto..."
            className="pl-9 h-9 text-xs bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="group relative rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#0a101d] border border-cyan-500/20 hover:border-cyan-500/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/40"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="outline" className="bg-cyan-950/60 text-cyan-300 border-cyan-500/30 text-[11px] font-semibold">
                  {course.categoryLabel}
                </Badge>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{course.rating.toFixed(1)}</span>
                  <span className="text-slate-400 text-[11px]">({course.studentsCount})</span>
                </div>
              </div>

              {/* Title & Highlight */}
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                {course.title}
              </h3>
              
              <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                {course.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {course.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer details & Action */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{course.hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{course.modulesCount} módulos</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActiveCourseModal(course);
                  setActiveLesson(course.modules[0]?.lessons[0] || 'Aula 1');
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm"
              >
                <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                Acessar Aulas
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Classroom Modal */}
      <Dialog open={!!activeCourseModal} onOpenChange={(open) => !open && setActiveCourseModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#090f1d] border-cyan-500/30 text-slate-100 p-0 rounded-2xl">
          {activeCourseModal && (
            <div>
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#0c162c] border-b border-cyan-500/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                      {activeCourseModal.categoryLabel}
                    </Badge>
                    <span className="text-xs text-slate-400">Instrutor: {activeCourseModal.instructor}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {activeCourseModal.title}
                  </h2>
                </div>
              </div>

              {/* Video Player Simulator & Lesson Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Left 2 Cols: Player */}
                <div className="lg:col-span-2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800">
                  {/* Simulated Screen */}
                  <div className="relative aspect-video rounded-xl bg-slate-950 border border-cyan-500/30 overflow-hidden flex flex-col items-center justify-center text-center p-6 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/40 via-transparent to-blue-950/30" />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/30 cursor-pointer hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        Reproduzindo: {activeLesson}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Resolução Full HD 1080p • Acesso Imediato
                      </p>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span>04:15 / 28:40</span>
                      <div className="flex-1 mx-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-1/4 h-full bg-cyan-400 rounded-full" />
                      </div>
                      <span>Velocidade 1.0x</span>
                    </div>
                  </div>

                  {/* Actions under player */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Button
                      onClick={() => toggleLessonDone(activeLesson)}
                      variant="outline"
                      size="sm"
                      className={`text-xs border ${
                        completedLessons[activeLesson]
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 mr-1.5 ${completedLessons[activeLesson] ? 'text-emerald-400' : ''}`} />
                      {completedLessons[activeLesson] ? 'Aula Concluída!' : 'Marcar como Concluída'}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300"
                        onClick={() => alert("Material de apoio baixado: Apostila_Tecnica_SmartTech.pdf")}
                      >
                        <Download className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                        Baixar Apostila PDF
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
                    <h4 className="text-xs font-bold text-cyan-300 mb-1">Notas do Instrutor</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sempre verifique o valor da resistência em relação ao terra (teste de condução reversa) antes de injetar tensão na malha positiva. Isso evita queimar CI de carga secundário.
                    </p>
                  </div>
                </div>

                {/* Right Col: Modules List */}
                <div className="p-4 bg-slate-950/50 max-h-[480px] overflow-y-auto">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Grade de Aulas</span>
                    <span className="text-cyan-400">{activeCourseModal.modulesCount} Módulos</span>
                  </div>

                  <div className="space-y-4">
                    {activeCourseModal.modules.map((mod, modIdx) => (
                      <div key={modIdx} className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200">{mod.title}</span>
                          <span className="text-[10px] text-slate-400">{mod.duration}</span>
                        </div>

                        <div className="space-y-1.5">
                          {mod.lessons.map((lesson, lessonIdx) => {
                            const isSelected = activeLesson === lesson;
                            const isDone = completedLessons[lesson];

                            return (
                              <button
                                key={lessonIdx}
                                onClick={() => setActiveLesson(lesson)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                  isSelected 
                                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Play className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-cyan-400 fill-current' : 'text-slate-500'}`} />
                                  <span className="truncate">{lesson}</span>
                                </div>
                                {isDone && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
