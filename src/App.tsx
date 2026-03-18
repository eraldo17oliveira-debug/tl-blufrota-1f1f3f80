import { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSession, MODULE_ACCESS } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import AppSidebar from "@/components/AppSidebar";
import PatioPage from "@/pages/PatioPage";
import RodizioPage from "@/pages/RodizioPage";
import CombustivelPage from "@/pages/CombustivelPage";
import InventarioPage from "@/pages/InventarioPage";
import NotFound from "@/pages/NotFound";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

function AppLayout({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const allowed = MODULE_ACCESS[session.perfil];
  const defaultRoute = `/${allowed[0]}`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar session={session} onLogout={onLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 glass-card border-b border-border/30 h-12 flex items-center px-4 gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-primary">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="font-orbitron text-xs text-primary neon-text">TL-BLU FROTA</span>
            <span className="ml-auto text-[0.6rem] text-muted-foreground font-orbitron">
              {session.nome} <span className="text-primary">• {session.perfil}</span>
            </span>
          </header>
          <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              {allowed.includes("patio") && <Route path="/patio" element={<PatioPage session={session} />} />}
              {allowed.includes("rodizio") && <Route path="/rodizio" element={<RodizioPage />} />}
              {allowed.includes("combustivel") && <Route path="/combustivel" element={<CombustivelPage />} />}
              {allowed.includes("inventario") && <Route path="/inventario" element={<InventarioPage />} />}
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {session ? (
            <AppLayout session={session} onLogout={() => setSession(null)} />
          ) : (
            <LoginScreen onLogin={setSession} />
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
