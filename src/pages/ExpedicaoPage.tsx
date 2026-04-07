import { useState, useEffect, useCallback } from "react";
import { lerPatio, todayStr } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function removeDash(placa: string): string {
  return placa.replace(/-/g, "");
}

export default function ExpedicaoPage({ session }: { session: UserSession }) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);

  const load = useCallback(async () => {
    const data = await lerPatio(date);
    setRecords(data);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  const ativos = records.filter(r => !r.concluido);

  // Sort: Bloqueio first, then Vazia, then rest
  const sorted = [...ativos].sort((a, b) => {
    const order = (r: any) => {
      if (r.status === "Bloqueio") return 0;
      if (r.estado === "Vazia") return 1;
      return 2;
    };
    return order(a) - order(b);
  });

  const totalPatio = ativos.length;
  const totalCarregadas = ativos.filter(r => r.estado === "Carga").length;
  const totalVazias = ativos.filter(r => r.estado === "Vazia" && r.status !== "Bloqueio").length;
  const emManutencao = ativos.filter(r => r.status === "Bloqueio").length;

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-accent uppercase" style={{ textShadow: "0 0 10px hsl(var(--accent) / 0.5)" }}>
        👁️ MONITORAMENTO DE CARRETAS NO PÁTIO
      </h1>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "TOTAL PÁTIO", val: totalPatio, cls: "text-primary border-primary/30" },
          { label: "CARREGADAS", val: totalCarregadas, cls: "text-accent border-accent/30" },
          { label: "VAZIAS", val: totalVazias, cls: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))]/30" },
          { label: "MANUTENÇÃO", val: emManutencao, cls: "text-destructive border-destructive/30" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.5rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-accent/20">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent" />
            <h2 className="font-orbitron text-sm font-bold text-accent uppercase">VISUALIZAÇÃO DO PÁTIO</h2>
          </div>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border/50 font-orbitron text-xs" />
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-orbitron text-[0.65rem] text-accent uppercase font-bold">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">FROTA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">CARGA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">LOCAL</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">SEGURANÇA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">EIXO</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">MODELO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">
                    NENHUMA CARRETA NO PÁTIO.
                  </TableCell>
                </TableRow>
              ) : sorted.map(r => (
                <TableRow key={r.id} className={cn("border-border/20 table-row-glow", r.status === "Bloqueio" && "bg-destructive/10")}>
                  <TableCell className="font-mono-neon text-accent text-sm">{removeDash(r.placa)}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>
                  <TableCell className="text-sm uppercase">{r.estado}</TableCell>
                  <TableCell className="text-sm uppercase">{r.local}</TableCell>
                  <TableCell className="text-sm uppercase">
                    <div className="flex items-center gap-1">
                      {r.status === "Bloqueio" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <span className={cn(r.status === "Bloqueio" && "text-destructive font-bold")}>{r.status}</span>
                    </div>
                    {r.status === "Bloqueio" && r.motivo_bloqueio && (
                      <p className="text-[0.6rem] text-destructive/80 mt-0.5">{r.motivo_bloqueio}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{r.eixo}</TableCell>
                  <TableCell className="text-sm">{r.modelo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
