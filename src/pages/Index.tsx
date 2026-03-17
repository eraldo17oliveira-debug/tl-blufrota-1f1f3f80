import { useState } from "react";
import { UserSession } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import VehicleForm from "@/components/VehicleForm";
import RecordsTable from "@/components/RecordsTable";
import { Button } from "@/components/ui/button";
import { Truck, LogOut } from "lucide-react";

export default function Index() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!session) return <LoginScreen onLogin={setSession} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">FROTA TL-BLU</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{session.nome} • {session.perfil}</span>
          <Button variant="ghost" size="sm" onClick={() => setSession(null)}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 p-4">
        <VehicleForm onSaved={() => setRefreshKey(k => k + 1)} />
        <RecordsTable refreshKey={refreshKey} />
      </main>
    </div>
  );
}
