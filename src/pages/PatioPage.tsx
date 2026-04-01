import { useState } from "react";
import { UserSession } from "@/lib/types";
import PatioForm from "@/components/PatioForm";
import PatioTable from "@/components/PatioTable";
import { Button } from "@/components/ui/button";
import { ClipboardList, Eye } from "lucide-react";

export default function PatioPage({ session }: { session: UserSession }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modo, setModo] = useState<"cadastro" | "monitoramento">("cadastro");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-orbitron text-lg font-bold text-primary neon-text">🚚 GESTÃO DE PÁTIO</h1>
        <div className="flex gap-2">
          <Button
            variant={modo === "cadastro" ? "default" : "outline"}
            size="sm"
            onClick={() => setModo("cadastro")}
            className="gap-1.5 font-orbitron text-xs uppercase"
          >
            <ClipboardList className="h-3.5 w-3.5" /> CADASTRO
          </Button>
          <Button
            variant={modo === "monitoramento" ? "default" : "outline"}
            size="sm"
            onClick={() => { setModo("monitoramento"); setRefreshKey(k => k + 1); }}
            className="gap-1.5 font-orbitron text-xs uppercase"
          >
            <Eye className="h-3.5 w-3.5" /> MONITORAMENTO
          </Button>
        </div>
      </div>

      {modo === "cadastro" ? (
        <PatioForm onSaved={() => setRefreshKey(k => k + 1)} onFechar={() => { setModo("monitoramento"); setRefreshKey(k => k + 1); }} />
      ) : (
        <PatioTable refreshKey={refreshKey} session={session} />
      )}
    </div>
  );
}
