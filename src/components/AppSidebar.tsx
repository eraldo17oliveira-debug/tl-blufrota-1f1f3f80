import { Truck, RotateCcw, LogOut, Building2, PackageCheck, Users, Wrench, Sun, Moon, Droplets } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { UserSession, getModuleAccess } from "@/lib/types";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const allModules = [
  { key: "patio", title: "GESTÃO DE PÁTIO", url: "/patio", icon: Truck },
  { key: "rodizio", title: "RODÍZIO DE PNEUS", url: "/rodizio", icon: RotateCcw },
  { key: "fornecedores", title: "FORNECEDORES", url: "/fornecedores", icon: Building2 },
  { key: "expedicao", title: "MONITORAMENTO", url: "/expedicao", icon: PackageCheck },
  { key: "os", title: "ORDEM DE SERVIÇO", url: "/os", icon: Wrench },
  { key: "lavacao", title: "LAVAÇÃO", url: "/lavacao", icon: Droplets },
];

interface Props { session: UserSession; onLogout: () => void; }

export default function AppSidebar({ session, onLogout }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const allowed = getModuleAccess(session.permissoes);
  const visibleModules = allModules.filter(m => allowed.includes(m.key));
  const isSupervisor = session.perfil === "SUPERVISOR";
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarContent className="bg-sidebar-background">
        <SidebarGroup>
          <SidebarGroupLabel className="font-orbitron text-primary text-xs neon-text uppercase tracking-wider">
            {!collapsed && "TL-BLU FROTA"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleModules.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end
                      className="hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-all duration-200 uppercase"
                      activeClassName="bg-primary/15 text-primary neon-glow-primary">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm font-medium font-orbitron text-[0.65rem]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isSupervisor && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/usuarios" end
                      className="hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-all duration-200 uppercase"
                      activeClassName="bg-primary/15 text-primary neon-glow-primary">
                      <Users className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm font-medium font-orbitron text-[0.65rem]">GESTÃO MASTER</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar-background border-t border-border/30 p-3 space-y-2">
        <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full text-muted-foreground hover:text-primary uppercase">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs font-orbitron">{theme === "dark" ? "MODO CLARO" : "MODO ESCURO"}</span>}
        </Button>
        {!collapsed && (
          <div className="text-[0.6rem] text-muted-foreground font-orbitron text-center uppercase">
            {session.nome} • <span className="text-primary">{session.perfil}</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onLogout} className="w-full text-muted-foreground hover:text-destructive uppercase">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 text-xs font-orbitron">SAIR</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
