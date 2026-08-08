import { cn } from "@/lib/utils";
import { Warehouse } from "lucide-react";

export interface DocaOcupacao {
  doca: string;
  placa: string;
  frota?: string;
  estado?: string;
  status?: string;
}

const LADO_A = Array.from({ length: 23 }, (_, i) => i + 1);       // 1 → 23
const LADO_B = Array.from({ length: 22 }, (_, i) => i + 24);      // 24 → 45

function DocaSlot({ n, ocup, side }: { n: number; ocup?: DocaOcupacao; side: "top" | "bottom" }) {
  const ocupada = !!ocup;
  const bloqueio = ocup?.status === "Bloqueio";
  const carga = ocup?.estado === "Carga";

  return (
    <div className={cn("flex flex-col items-center gap-1 w-[58px] shrink-0", side === "bottom" && "flex-col-reverse")}>
      {/* número da doca */}
      <span className="font-orbitron text-[0.55rem] text-muted-foreground">{n}</span>

      {/* boca da doca */}
      <div
        className={cn(
          "w-full h-3 rounded-sm border transition-colors",
          ocupada ? "border-primary/60 bg-primary/30" : "border-border/50 bg-secondary/40"
        )}
      />

      {/* carreta estacionada */}
      <div
        title={ocup ? `DOCA ${n} • ${ocup.placa}` : `DOCA ${n} • LIVRE`}
        className={cn(
          "w-full h-11 rounded-md border flex flex-col items-center justify-center px-0.5 transition-all duration-300",
          !ocupada && "border-dashed border-border/40 bg-transparent",
          ocupada && !bloqueio && !carga && "border-primary/60 bg-primary/15 shadow-[0_0_10px_hsl(var(--primary)/0.35)]",
          ocupada && carga && !bloqueio && "border-accent/60 bg-accent/15 shadow-[0_0_10px_hsl(var(--accent)/0.35)]",
          ocupada && bloqueio && "border-destructive/70 bg-destructive/20 animate-pulse"
        )}
      >
        {ocupada ? (
          <>
            <span className="font-mono-neon text-[0.55rem] leading-tight text-primary">{ocup!.placa}</span>
            {ocup!.frota && (
              <span className="font-orbitron text-[0.45rem] leading-tight text-muted-foreground">{ocup!.frota}</span>
            )}
          </>
        ) : (
          <span className="font-orbitron text-[0.45rem] text-muted-foreground/50 uppercase">LIVRE</span>
        )}
      </div>
    </div>
  );
}

export default function DocasMap({ ocupacoes }: { ocupacoes: DocaOcupacao[] }) {
  const mapa = new Map<string, DocaOcupacao>();
  ocupacoes.forEach(o => { if (o.doca) mapa.set(String(parseInt(o.doca, 10)), o); });

  const ocupadas = LADO_A.concat(LADO_B).filter(n => mapa.has(String(n))).length;

  return (
    <div className="m-4 rounded-2xl border border-border/40 bg-background/40 p-4 overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-primary" />
          <h3 className="font-orbitron text-xs font-bold text-primary neon-text uppercase">VISTA AÉREA — DOCAS DO GALPÃO</h3>
        </div>
        <div className="flex items-center gap-3 font-orbitron text-[0.55rem] uppercase text-muted-foreground">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary/60 inline-block" /> OCUPADA</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-accent/60 inline-block" /> CARGA</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-destructive/70 inline-block" /> BLOQUEIO</span>
          <span className="text-primary">{ocupadas}/45</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1400px] space-y-2">
          {/* lado A — docas 1 a 23 */}
          <div className="flex gap-1.5 justify-start">
            {LADO_A.map(n => <DocaSlot key={n} n={n} ocup={mapa.get(String(n))} side="top" />)}
          </div>

          {/* corpo do galpão */}
          <div className="relative h-16 rounded-lg border border-primary/30 bg-[repeating-linear-gradient(45deg,hsl(var(--muted)/0.25)_0px,hsl(var(--muted)/0.25)_10px,transparent_10px,transparent_20px)] flex items-center justify-center">
            <span className="font-orbitron text-[0.7rem] tracking-[0.5em] text-primary/70 uppercase">GALPÃO TL-BLU</span>
          </div>

          {/* lado B — docas 24 a 45 */}
          <div className="flex gap-1.5 justify-start">
            {LADO_B.map(n => <DocaSlot key={n} n={n} ocup={mapa.get(String(n))} side="bottom" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
