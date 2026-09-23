import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MelhorEnvioCallback from "./pages/MelhorEnvioCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 1. Página Inicial de Acesso: Cadastro / Login da Loja */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/cadastro" element={<AuthPage />} />
          <Route path="/vsl" element={<Navigate to="/" replace />} />

          {/* 2. Plataforma Principal da Loja (Requer conta cadastrada; bloqueada se plano demo) */}
          <Route path="/app" element={<Index />} />
          <Route path="/plataforma" element={<Index />} />
          <Route path="/demo" element={<Index />} />

          {/* 3. Painel Administrativo Geral (Acesso exclusivo master admin) */}
          <Route path="/admin" element={<AdminPage />} />

          {/* 4. Integração Melhor Envio OAuth Callback */}
          <Route path="/api/melhor-envio/callback" element={<MelhorEnvioCallback />} />
          <Route path="/melhor-envio/callback" element={<MelhorEnvioCallback />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
