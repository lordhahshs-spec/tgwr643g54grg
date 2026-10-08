import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-load heavier / secondary routes for lightning-fast initial page load
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MelhorEnvioCallback = lazy(() => import("./pages/MelhorEnvioCallback"));
const TradeInCameraPage = lazy(() => import("./pages/TradeInCameraPage"));
const StoreShowcasePublicPage = lazy(() => import("./pages/StoreShowcasePublicPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache to reduce server load
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-400 text-xs">
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span>Carregando CellHub...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 1. Página Inicial de Acesso: Cadastro / Login da Loja */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/cadastro" element={<AuthPage />} />
            <Route path="/vsl" element={<Navigate to="/" replace />} />

            {/* 2. Plataforma Principal da Loja */}
            <Route path="/app" element={<Index />} />
            <Route path="/plataforma" element={<Index />} />
            <Route path="/demo" element={<Index />} />

            {/* 3. Painel Administrativo Geral */}
            <Route path="/admin" element={<AdminPage />} />

            {/* 4. Integração Melhor Envio OAuth Callback */}
            <Route path="/api/melhor-envio/callback" element={<MelhorEnvioCallback />} />
            <Route path="/melhor-envio/callback" element={<MelhorEnvioCallback />} />

            {/* 5. Fluxo de Captura Mobile via QR Code para CellHub IA */}
            <Route path="/tradein/camera/:sessionId" element={<TradeInCameraPage />} />

            {/* 6. Vitrine Virtual / Catálogo Público do Lojista para Clientes */}
            <Route path="/vitrine/:storeId" element={<StoreShowcasePublicPage />} />
            <Route path="/catalogo/:storeId" element={<StoreShowcasePublicPage />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
