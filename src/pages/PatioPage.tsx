import { useState } from "react";
import { UserSession } from "@/lib/types";
import PatioForm from "@/components/PatioForm";
import PatioTable from "@/components/PatioTable";

export default function PatioPage({ session }: { session: UserSession }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text">🚚 Gestão de Pátio</h1>
      <PatioForm onSaved={() => setRefreshKey(k => k + 1)} />
      <PatioTable refreshKey={refreshKey} session={session} />
    </div>
  );
}
