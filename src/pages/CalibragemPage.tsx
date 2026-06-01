import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Gauge, Plus, Trash2, AlertTriangle, Search, X } from "lucide-react";
import PlacaInput from "@/components/PlacaInput";

const LIMITE_DIAS = 30; // alerta a partir desse número
const DATA_INICIO = new Date(2026, 5, 1); // 01/06/2026 — base para placas sem registro

type Registro = { id: string; placa: string; frota: string; observacoes: string; responsavel: string; created_at: string };

function normPlaca(p: string) {
  return (p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function CalibragemPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [obs, setObs] = useState("");
  const [resp, setResp] = useState("");
  const [busca, setBusca] = useState("");
  const [placasPatio, setPlacasPatio] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("calibragem" as any).select("*").order("created_at", { ascending: false });
    setRegistros(((data as any) || []) as Registro[]);
  }, []);

  useEffect(() => {
    carregar();
    // Placas vistas nos últimos 90 dias no pátio
    (async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("patio").select("placa").gte("created_at", since);
      const set = new Set<string>();
      (data || []).forEach((r: any) => { const p = normPlaca(r.placa); if (p) set.add(p); });
      setPlacasPatio(Array.from(set));
    })();
  }, [carregar]);

  const salvar = async () => {
    const p = normPlaca(placa);
    if (p.length < 7) { toast.error("PLACA INVÁLIDA!"); return; }
    const { error } = await supabase.from("calibragem" as any).insert({
      placa: p, frota: frota.toUpperCase(), observacoes: obs.toUpperCase(), responsavel: resp.toUpperCase(),
    } as any);
    if (error) { toast.error("ERRO AO SALVAR!"); return; }
    toast.success("✅ CALIBRAGEM REGISTRADA!");
    setPlaca(""); setFrota(""); setObs(""); setResp("");
    carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("EXCLUIR ESTE REGISTRO?")) return;
    await supabase.from("calibragem" as any).delete().eq("id", id);
    toast.success("REGISTRO EXCLUÍDO");
    carregar();
  };

  // Última calibragem por placa
  const ultimoPorPlaca = useMemo(() => {
    const map: Record<string, Registro> = {};
    registros.forEach(r => {
      const k = normPlaca(r.placa);
      if (!map[k] || new Date(r.created_at) > new Date(map[k].created_at)) map[k] = r;
    });
    return map;
  }, [registros]);

  // Lista consolidada: todas as placas do pátio + calibragens
  const consolidada = useMemo(() => {
    const placas = new Set<string>([...placasPatio, ...Object.keys(ultimoPorPlaca)]);
    const arr = Array.from(placas).map(p => {
      const u = ultimoPorPlaca[p];
      const dias = u ? Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86400000) : 9999;
      return { placa: p, ultima: u, dias };
    });
    arr.sort((a, b) => b.dias - a.dias);
    return arr;
  }, [placasPatio, ultimoPorPlaca]);

  const filtrada = busca
    ? consolidada.filter(r => r.placa.includes(normPlaca(busca)))
    : consolidada;

  const alertas = consolidada.filter(r => r.dias >= LIMITE_DIAS);
  const ok = consolidada.filter(r => r.dias < LIMITE_DIAS);

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold uppercase" style={{ color: "hsl(190 100% 60%)", textShadow: "0 0 10px hsl(190 100% 50% / 0.5)" }}>
        🛞 CALIBRAGEM DE PNEUS
      </h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center border" style={{ borderColor: "hsl(0 80% 50% / 0.4)", color: "hsl(0 90% 65%)" }}>
          <p className="text-2xl font-bold font-orbitron">{alertas.length}</p>
          <p className="text-[0.55rem] font-orbitron uppercase">EM ALERTA (≥{LIMITE_DIAS}D)</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border" style={{ borderColor: "hsl(140 70% 45% / 0.4)", color: "hsl(140 70% 60%)" }}>
          <p className="text-2xl font-bold font-orbitron">{ok.length}</p>
          <p className="text-[0.55rem] font-orbitron uppercase">EM DIA</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border border-primary/30 text-primary">
          <p className="text-2xl font-bold font-orbitron">{registros.length}</p>
          <p className="text-[0.55rem] font-orbitron uppercase">TOTAL REGISTROS</p>
        </div>
      </div>

      <Card className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2" style={{ color: "hsl(190 100% 60%)" }}>
          <Plus className="h-4 w-4" />
          <span className="font-orbitron text-sm font-bold uppercase">NOVA CALIBRAGEM</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PlacaInput value={placa} onChange={setPlaca} />
          <Input placeholder="FROTA" value={frota} onChange={e => setFrota(e.target.value.toUpperCase())} className="uppercase font-orbitron bg-input border-border/50 h-12" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="RESPONSÁVEL" value={resp} onChange={e => setResp(e.target.value.toUpperCase())} className="uppercase font-orbitron bg-input border-border/50 h-11" />
          <Input placeholder="OBSERVAÇÕES (PSI, ETC)" value={obs} onChange={e => setObs(e.target.value.toUpperCase())} className="uppercase font-orbitron bg-input border-border/50 h-11" />
        </div>
        <Button onClick={salvar} className="w-full font-orbitron uppercase gap-2 h-11" style={{ background: "hsl(190 100% 45%)", color: "hsl(220 50% 8%)" }}>
          <Gauge className="h-4 w-4" /> REGISTRAR CALIBRAGEM
        </Button>
      </Card>

      {alertas.length > 0 && (
        <Card className="glass-card p-5 space-y-3" style={{ background: "linear-gradient(135deg, hsl(0 80% 50% / 0.08), transparent)", borderColor: "hsl(0 80% 50% / 0.4)" }}>
          <div className="flex items-center gap-2" style={{ color: "hsl(0 90% 65%)" }}>
            <AlertTriangle className="h-4 w-4" />
            <span className="font-orbitron text-sm font-bold uppercase">PLACAS PRECISANDO CALIBRAR ({alertas.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertas.map(a => (
              <div key={a.placa} className="rounded-xl px-3 py-2 border flex flex-col" style={{ background: "hsl(0 80% 50% / 0.15)", borderColor: "hsl(0 80% 50% / 0.5)" }}>
                <span className="font-mono-neon text-sm font-bold" style={{ color: "hsl(0 90% 70%)" }}>{a.placa}</span>
                <span className="text-[0.6rem] font-orbitron uppercase" style={{ color: "hsl(0 90% 75%)" }}>
                  {a.ultima ? `${a.dias}D SEM CALIBRAR` : "NUNCA CALIBRADA"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="glass-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center gap-2 flex-wrap">
          <span className="font-orbitron text-sm font-bold uppercase" style={{ color: "hsl(190 100% 60%)" }}>STATUS GERAL DAS CARRETAS</span>
          <div className="relative ml-auto flex-1 min-w-[200px] max-w-[280px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "hsl(190 100% 60%)" }} />
            <Input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="BUSCAR PLACA..."
              className="pl-8 uppercase font-mono-neon text-sm bg-input h-10"
              style={{ borderColor: "hsl(190 100% 50% / 0.4)" }}
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center" style={{ background: "hsl(190 100% 50% / 0.2)", color: "hsl(190 100% 60%)" }}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">ÚLTIMA CALIBRAGEM</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">DIAS</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">RESPONSÁVEL</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">OBS</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrada.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-orbitron text-xs uppercase">NENHUMA PLACA</TableCell></TableRow>
              ) : filtrada.map(r => {
                const alerta = r.dias >= LIMITE_DIAS;
                return (
                  <TableRow key={r.placa} className="border-border/20" style={alerta ? { background: "hsl(0 80% 50% / 0.08)" } : undefined}>
                    <TableCell className="font-mono-neon text-sm font-bold" style={{ color: alerta ? "hsl(0 90% 70%)" : "hsl(190 100% 60%)" }}>{r.placa}</TableCell>
                    <TableCell className="text-xs font-orbitron">
                      {r.ultima ? new Date(r.ultima.created_at).toLocaleDateString("pt-BR") : <span className="opacity-50">—</span>}
                    </TableCell>
                    <TableCell className="font-orbitron text-sm font-bold" style={{ color: alerta ? "hsl(0 90% 70%)" : "hsl(140 70% 60%)" }}>
                      {r.ultima ? `${r.dias}D` : "—"}
                    </TableCell>
                    <TableCell className="text-xs uppercase">{r.ultima?.responsavel || "—"}</TableCell>
                    <TableCell className="text-xs uppercase">{r.ultima?.observacoes || "—"}</TableCell>
                    <TableCell>
                      {r.ultima && (
                        <Button variant="ghost" size="icon" onClick={() => excluir(r.ultima!.id)} className="text-destructive h-8 w-8">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
