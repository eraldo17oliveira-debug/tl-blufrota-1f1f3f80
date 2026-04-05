import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSession, getModuleAccess } from "@/lib/types";
import { getPersistedSession, persistSession } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import AppSidebar from "@/components/AppSidebar";
import PatioPage from "@/pages/PatioPage";
import RodizioPage from "@/pages/RodizioPage";
import FornecedoresPage from "@/pages/FornecedoresPage";
import ExpedicaoPage from "@/pages/ExpedicaoPage";
import UsuariosPage from "@/pages/UsuariosPage";
import OrdemServicoPage from "@/pages/OrdemServicoPage";
import LavacaoPage from "@/pages/LavacaoPage";
import LavacaoPublicaPage from "@/pages/LavacaoPublicaPage";
import NotFound from "@/pages/NotFound";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

function AppLayout({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const allowed = getModuleAccess(session.permissoes);
  const defaultRoute = `/${allowed[0] || "patio"}`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar session={session} onLogout={onLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 glass-card border-b border-border/30 h-12 flex items-center px-4 gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="font-orbitron text-xs text-primary neon-text uppercase tracking-wider">TL-BLU FROTA V6</span>
            <span className="ml-auto text-[0.6rem] text-muted-foreground font-orbitron uppercase">
              {session.nome} <span className="text-primary">• {session.perfil}</span>
            </span>
          </header>
          <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              {allowed.includes("patio") && <Route path="/patio" element={<PatioPage session={session} />} />}
              {allowed.includes("rodizio") && <Route path="/rodizio" element={<RodizioPage session={session} />} />}
              {allowed.includes("fornecedores") && <Route path="/fornecedores" element={<FornecedoresPage session={session} />} />}
              {allowed.includes("expedicao") && <Route path="/expedicao" element={<ExpedicaoPage session={session} />} />}
              {allowed.includes("os") && <Route path="/os" element={<OrdemServicoPage session={session} />} />}
              {allowed.includes("lavacao") && <Route path="/lavacao" element={<LavacaoPage session={session} />} />}
              {session.perfil === "SUPERVISOR" && <Route path="/usuarios" element={<UsuariosPage />} />}
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => getPersistedSession());

  const handleLogout = () => {
    persistSession(null);
    setSession(null);
  };

  const handleLogin = (s: UserSession) => {
    persistSession(s);
    setSession(s);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/lavacao-publica" element={<LavacaoPublicaPage />} />
            <Route path="*" element={
              session ? (
                <AppLayout session={session} onLogout={handleLogout} />
              ) : (
                <LoginScreen onLogin={handleLogin} />
              )
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
