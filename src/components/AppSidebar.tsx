import { Truck, RotateCcw, Fuel, Package, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { UserSession, MODULE_ACCESS } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const allModules = [
  { key: "patio", title: "Gestão de Pátio", url: "/patio", icon: Truck },
  { key: "rodizio", title: "Rodízio de Pneus", url: "/rodizio", icon: RotateCcw },
  { key: "combustivel", title: "Combustível", url: "/combustivel", icon: Fuel },
  { key: "inventario", title: "Inventário", url: "/inventario", icon: Package },
];

interface Props {
  session: UserSession;
  onLogout: () => void;
}

export default function AppSidebar({ session, onLogout }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const allowed = MODULE_ACCESS[session.perfil];
  const visibleModules = allModules.filter(m => allowed.includes(m.key));

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarContent className="bg-card/80 backdrop-blur-xl">
        <SidebarGroup>
          <SidebarGroupLabel className="font-orbitron text-primary text-xs neon-text">
            {!collapsed && "TL-BLU FROTA"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleModules.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-all duration-200"
                      activeClassName="bg-primary/15 text-primary neon-glow-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-card/80 backdrop-blur-xl border-t border-border/30 p-3">
        {!collapsed && (
          <div className="text-[0.6rem] text-muted-foreground font-orbitron mb-2 text-center">
            {session.nome} • {session.perfil}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onLogout} className="w-full text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 text-xs">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
