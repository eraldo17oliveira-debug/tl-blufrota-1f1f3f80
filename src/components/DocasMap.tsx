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

// vagas do pátio: 12 na frente (P1→P12) e 12 na lateral (P13→P24)
const PATIO_FRENTE = Array.from({ length: 12 }, (_, i) => `P${i + 1}`);
const PATIO_LATERAL = Array.from({ length: 12 }, (_, i) => `P${i + 13}`);

function normKey(v: string): string {
  const s = String(v || "").toUpperCase().trim();
  if (s.startsWith("P")) return `P${parseInt(s.slice(1), 10)}`;
  return String(parseInt(s, 10));
}

function Slot({
  code,
  label,
  ocup,
  side,
  patio,
}: {
  code: string;
  label: string;
  ocup?: DocaOcupacao;
  side: "top" | "bottom";
  patio?: boolean;
}) {
  const ocupada = !!ocup;
  const bloqueio = ocup?.status === "Bloqueio";
  const carga = ocup?.estado === "Carga";
  const laranja = "hsl(var(--neon-orange))";

  return (
    <div className={cn("flex flex-col items-center gap-1 w-[58px] shrink-0", side === "bottom" && "flex-col-reverse")}>
      <span
        className="font-orbitron text-[0.55rem]"
        style={patio ? { color: laranja } : undefined}
      >
        <span className={patio ? "" : "text-muted-foreground"}>{label}</span>
      </span>

      {/* boca da doca / marcação da vaga */}
      <div
        className={cn("w-full h-3 rounded-sm border transition-colors")}
        style={
          patio
            ? {
                borderColor: `hsl(var(--neon-orange) / ${ocupada ? 0.7 : 0.35})`,
                background: ocupada ? "hsl(var(--neon-orange) / 0.3)" : "transparent",
              }
            : undefined
        }
      >
        {!patio && (
          <div
            className={cn(
              "w-full h-full rounded-sm",
              ocupada ? "bg-primary/30" : "bg-secondary/40"
            )}
          />
        )}
      </div>

      {/* carreta estacionada */}
      <div
        title={ocup ? `${label} • ${ocup.placa}` : `${label} • LIVRE`}
        className={cn(
          "w-full h-11 rounded-md border flex flex-col items-center justify-center px-0.5 transition-all duration-300",
          !ocupada && "border-dashed border-border/40 bg-transparent",
          !patio && ocupada && !bloqueio && !carga && "border-primary/60 bg-primary/15 shadow-[0_0_10px_hsl(var(--primary)/0.35)]",
          !patio && ocupada && carga && !bloqueio && "border-accent/60 bg-accent/15 shadow-[0_0_10px_hsl(var(--accent)/0.35)]",
          ocupada && bloqueio && "border-destructive/70 bg-destructive/20 animate-pulse"
        )}
        style={
          patio && ocupada && !bloqueio
            ? {
                borderColor: "hsl(var(--neon-orange) / 0.7)",
                background: "hsl(var(--neon-orange) / 0.18)",
                boxShadow: "0 0 10px hsl(var(--neon-orange) / 0.35)",
              }
            : undefined
        }
      >
        {ocupada ? (
          <>
            <span
              className="font-mono-neon text-[0.55rem] leading-tight"
              style={patio ? { color: laranja } : undefined}
            >
              <span className={patio ? "" : "text-primary"}>{ocup!.placa}</span>
            </span>
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
  ocupacoes.forEach(o => { if (o.doca) mapa.set(normKey(o.doca), o); });

  const ocupadas = LADO_A.concat(LADO_B).filter(n => mapa.has(String(n))).length;
  const patioOcupadas = PATIO_FRENTE.concat(PATIO_LATERAL).filter(c => mapa.has(c)).length;

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
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-sm inline-block" style={{ background: "hsl(var(--neon-orange) / 0.7)" }} /> PÁTIO
          </span>
          <span className="text-primary">DOCAS {ocupadas}/45</span>
          <span style={{ color: "hsl(var(--neon-orange))" }}>PÁTIO {patioOcupadas}/24</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1400px] space-y-2">
          {/* lado A — docas 1 a 23 */}
          <div className="flex gap-1.5 justify-start">
            {LADO_A.map(n => <Slot key={n} code={String(n)} label={String(n)} ocup={mapa.get(String(n))} side="top" />)}
          </div>

          {/* corpo do galpão */}
          <div className="relative h-16 rounded-lg border border-primary/30 bg-[repeating-linear-gradient(45deg,hsl(var(--muted)/0.25)_0px,hsl(var(--muted)/0.25)_10px,transparent_10px,transparent_20px)] flex items-center justify-center">
            <span className="font-orbitron text-[0.7rem] tracking-[0.5em] text-primary/70 uppercase">GALPÃO TL-BLU</span>
          </div>

          {/* lado B — docas 24 a 45 */}
          <div className="flex gap-1.5 justify-start">
            {LADO_B.map(n => <Slot key={n} code={String(n)} label={String(n)} ocup={mapa.get(String(n))} side="bottom" />)}
          </div>

          {/* ===== VAGAS DO PÁTIO ===== */}
          <div
            className="mt-4 rounded-xl border p-3 space-y-3"
            style={{
              borderColor: "hsl(var(--neon-orange) / 0.45)",
              background: "hsl(var(--neon-orange) / 0.06)",
              boxShadow: "0 0 20px hsl(var(--neon-orange) / 0.12)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-orbitron text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--neon-orange))" }}>
                VAGAS DO PÁTIO — 12 FRENTE / 12 LATERAL
              </h4>
            </div>

            <div>
              <p className="font-orbitron text-[0.5rem] uppercase text-muted-foreground mb-1">FRENTE (P1 → P12)</p>
              <div className="flex gap-1.5 justify-start">
                {PATIO_FRENTE.map(c => <Slot key={c} code={c} label={c} ocup={mapa.get(c)} side="top" patio />)}
              </div>
            </div>

            <div>
              <p className="font-orbitron text-[0.5rem] uppercase text-muted-foreground mb-1">LATERAL (P13 → P24)</p>
              <div className="flex gap-1.5 justify-start">
                {PATIO_LATERAL.map(c => <Slot key={c} code={c} label={c} ocup={mapa.get(c)} side="bottom" patio />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
