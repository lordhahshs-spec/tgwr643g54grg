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
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  instructor: string;
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
    description: 'Diagnóstico de placas-mãe, micro soldagem, substituição de conectores Type-C, troca de telas e interpretação de esquemas elétricos em aparelhos Samsung, Motorola e Xiaomi.',
    instructor: 'Prof. Carlos Eduardo',
    tags: ['Micro Solda', 'Placa Android', 'Conectores', 'Multímetro'],
    modules: [
      {
        title: 'Módulo 1: Montagem de Bancada e Ferramentas',
        duration: '4h 30m',
        lessons: ['Estações de retrabalho e ferros de solda recomendados', 'Uso seguro de ESD e proteção antiestática', 'Multímetro digital e fonte de bancada ajustável'],
      },
      {
        title: 'Módulo 2: Desmontagem Segura e Troca de Periféricos',
        duration: '6h 15m',
        lessons: ['Remoção de tampas traseiras sem quebra', 'Troca de baterias blindadas com segurança', 'Substituição de câmeras e subplacas'],
      },
    ],
  },
  {
    id: '2',
    title: 'Técnicas de Vendas de Celulares & Fechamento',
    category: 'vendas',
    categoryLabel: 'Vendas & Negociação',
    level: 'Iniciante',
    hours: 22,
    modulesCount: 5,
    rating: 4.95,
    studentsCount: 2150,
    description: 'Metodologia prática para dobrar as vendas de smartphones novos e seminovos, quebrar objeções de preço e criar fidelização pós-venda.',
    instructor: 'Renata Vasconcelos',
    tags: ['Script de Vendas', 'Objeção de Preço', 'WhatsApp Vendedor', 'Garantia'],
    modules: [
      {
        title: 'Módulo 1: Abordagem de Alto Impacto',
        duration: '3h 45m',
        lessons: ['Gatilhos mentais para vendas de smartphones', 'Como qualificar o perfil do cliente em 2 minutos', 'Apresentação do aparelho com foco no benefício'],
      },
      {
        title: 'Módulo 2: O Poder do Simulador de Financiamento',
        duration: '4h 20m',
        lessons: ['Como utilizar a simulação para fechar na hora', 'Apresentação da parcela que cabe no bolso', 'Eliminando o medo de crédito negado'],
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
    description: 'Recuperação de telas originais mantendo o touch e display de fábrica. Aplicação de filme OCA, separadora de tela e máquina tira-bolhas.',
    instructor: 'Leandro Rossi',
    tags: ['Cola OCA', 'Separadora a Vácuo', 'Tira Bolhas', 'Aparelhos Curvos'],
    modules: [
      {
        title: 'Módulo 1: Teoria dos Displays',
        duration: '3h 30m',
        lessons: ['Diferenças construtivas e sensibilidade térmica', 'Quando vale a pena recondicionar o vidro', 'Calculando o lucro por tela'],
      },
    ],
  },
  {
    id: '4',
    title: 'Software Android, Flashing e Recuperação de Sistema',
    category: 'software',
    categoryLabel: 'Software & Flash',
    level: 'Avançado',
    hours: 28,
    modulesCount: 6,
    rating: 4.88,
    studentsCount: 1450,
    description: 'Restauração de aparelhos travados no logo, reinstalação de firmwares oficiais (Odin Samsung, Fastboot Xiaomi), reparo de IMEI e correções de segurança.',
    instructor: 'Marcos Vinicius',
    tags: ['Odin Samsung', 'Fastboot', 'FRP', 'Firmware Stock'],
    modules: [
      {
        title: 'Módulo 1: Drivers USB e Flash',
        duration: '3h 10m',
        lessons: ['Instalação correta de drivers ADB e Fastboot', 'Resolução de problemas de porta COM e cabos de dados', 'Identificação correta da ROM de cada modelo'],
      },
    ],
  },
];

export const CursosTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<string>('Aula 1: Conceitos Iniciais');
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
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-[#080c17] border border-[#00D287]/20 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs px-2.5 py-0.5">
            <GraduationCap className="w-3.5 h-3.5 mr-1" />
            Capacitação Técnica & Vendas
          </Badge>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white">
          Cursos de Manutenção & <span className="text-[#00D287]">Vendas</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Aulas práticas de bancada para técnicos e consultores de vendas de smartphones.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080c17] border border-white/5 rounded-xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'tecnico', label: 'Hardware' },
            { id: 'vendas', label: 'Vendas' },
            { id: 'oca', label: 'Telas OCA' },
            { id: 'software', label: 'Software' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#00D287] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar assunto..."
            className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-lg"
          />
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="group rounded-2xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/40 p-5 flex flex-col justify-between transition-all hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="outline" className="bg-[#00D287]/10 text-[#00D287] border-[#00D287]/20 text-[10px]">
                  {course.categoryLabel}
                </Badge>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{course.rating.toFixed(1)}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-[#00D287] transition-colors">
                {course.title}
              </h3>
              
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {course.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>{course.hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>{course.modulesCount} módulos</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActiveCourseModal(course);
                  setActiveLesson(course.modules[0]?.lessons[0] || 'Aula 1');
                }}
                className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg"
              >
                <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                Assistir
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Classroom Modal */}
      <Dialog open={!!activeCourseModal} onOpenChange={(open) => !open && setActiveCourseModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#080c17] border-white/10 text-slate-100 p-0 rounded-2xl">
          {activeCourseModal && (
            <div>
              <div className="p-4 bg-slate-950 border-b border-white/5 flex items-start justify-between">
                <div>
                  <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-[10px] mb-1">
                    {activeCourseModal.categoryLabel}
                  </Badge>
                  <h2 className="text-base font-bold text-white">
                    {activeCourseModal.title}
                  </h2>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Screen */}
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-white/5 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#00D287] text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-md">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {activeLesson}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vídeo aula em alta resolução
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => toggleLessonDone(activeLesson)}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 mr-1.5 ${completedLessons[activeLesson] ? 'text-[#00D287]' : ''}`} />
                    {completedLessons[activeLesson] ? 'Concluída' : 'Marcar como Concluída'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-[#00D287]"
                    onClick={() => alert("Material baixado!")}
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-[#00D287]" />
                    Apostila PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
