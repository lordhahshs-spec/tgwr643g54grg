import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VSLPage from "./pages/VSL";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 1. Página de VSL Inicial */}
          <Route path="/" element={<VSLPage />} />
          
          {/* 2. Aba de Login / Cadastro pós-VSL (Nome da Empresa, Nome do Dono, CNPJ, Email, Senha) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/cadastro" element={<AuthPage />} />

          {/* 3. Plataforma Principal da Loja com Simulador e Módulos */}
          <Route path="/app" element={<Index />} />
          <Route path="/plataforma" element={<Index />} />
          <Route path="/demo" element={<Index />} />

          {/* 4. Painel Administrativo Geral com Gestão de Usuários */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
