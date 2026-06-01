import { useState, useEffect, useCallback } from "react";
import { lerPatio, todayStr } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, AlertTriangle, Bell, Pencil, Check, X, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function removeDash(placa: string): string {
  return placa.replace(/-/g, "");
}
function normPlaca(p: string): string {
  return (p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type AlertaRow = { id: string; placa: string; motivo: string; ativo: boolean };

export default function ExpedicaoPage({ session }: { session: UserSession }) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<Record<string, string>>({});
  const [alertasList, setAlertasList] = useState<AlertaRow[]>([]);
  const [editAlerta, setEditAlerta] = useState<AlertaRow | null>(null);
  const [editPlaca, setEditPlaca] = useState("");
  const [editMotivo, setEditMotivo] = useState("");
  const [diasMap, setDiasMap] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const data = await lerPatio(date);
    setRecords(data);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  // Dias na empresa por placa (primeira entrada nos últimos 90 dias)
  useEffect(() => {
    (async () => {
      if (records.length === 0) { setDiasMap({}); return; }
      const placas = Array.from(new Set(records.map(r => (r.placa || "").toUpperCase())));
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("patio").select("placa, created_at")
        .in("placa", placas).gte("created_at", since)
        .order("created_at", { ascending: true });
      const first: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        const p = (r.placa || "").toUpperCase();
        if (!first[p]) first[p] = r.created_at;
      });
      const now = Date.now();
      const map: Record<string, number> = {};
      Object.entries(first).forEach(([p, ts]) => {
        map[p] = Math.floor((now - new Date(ts).getTime()) / (1000 * 60 * 60 * 24));
      });
      setDiasMap(map);
    })();
  }, [records]);

  const carregarAlertas = useCallback(async () => {
    const { data } = await supabase.from("placas_alerta" as any).select("id, placa, motivo, ativo");
    const list = ((data as any) || []) as AlertaRow[];
    setAlertasList(list);
    const map: Record<string, string> = {};
    list.forEach((p) => {
      if (p.ativo) map[normPlaca(p.placa)] = p.motivo || "PLACA EM ALERTA";
    });
    setAlertas(map);
  }, []);

  useEffect(() => {
    carregarAlertas();
    const ch = supabase.channel("placas_alerta_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "placas_alerta" }, () => carregarAlertas())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [carregarAlertas]);

  const openEdit = (a: AlertaRow) => {
    setEditAlerta(a);
    setEditPlaca(a.placa);
    setEditMotivo(a.motivo || "");
  };
  const saveEdit = async () => {
    if (!editAlerta) return;
    const { error } = await supabase.from("placas_alerta" as any)
      .update({ placa: editPlaca.toUpperCase(), motivo: editMotivo.toUpperCase() } as any)
      .eq("id", editAlerta.id);
    if (error) { toast.error("ERRO AO SALVAR!"); return; }
    toast.success("ALERTA ATUALIZADO!");
    setEditAlerta(null);
    carregarAlertas();
  };
  const removerAlerta = async (id: string) => {
    if (!confirm("DESATIVAR ESTE ALERTA?")) return;
    await supabase.from("placas_alerta" as any).update({ ativo: false } as any).eq("id", id);
    toast.success("ALERTA DESATIVADO!");
    carregarAlertas();
  };

  const ativos = records.filter(r => !r.concluido);

  // Sort: Bloqueio first, then Alerta, then Vazia, then rest
  const sorted = [...ativos].sort((a, b) => {
    const order = (r: any) => {
      if (r.status === "Bloqueio") return 0;
      if (alertas[normPlaca(r.placa)]) return 1;
      if (r.estado === "Vazia") return 2;
      return 3;
    };
    return order(a) - order(b);
  });

  const totalPatio = ativos.length;
  const totalCarregadas = ativos.filter(r => r.estado === "Carga").length;
  const totalVazias = ativos.filter(r => r.estado === "Vazia" && r.status !== "Bloqueio").length;
  const emManutencao = ativos.filter(r => r.status === "Bloqueio").length;
  const totalAlerta = ativos.filter(r => alertas[normPlaca(r.placa)]).length;

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-accent uppercase" style={{ textShadow: "0 0 10px hsl(var(--accent) / 0.5)" }}>
        👁️ MONITORAMENTO DE CARRETAS NO PÁTIO
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "TOTAL PÁTIO", val: totalPatio, cls: "text-primary border-primary/30" },
          { label: "CARREGADAS", val: totalCarregadas, cls: "text-accent border-accent/30" },
          { label: "VAZIAS", val: totalVazias, cls: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))]/30" },
          { label: "MANUTENÇÃO", val: emManutencao, cls: "text-destructive border-destructive/30" },
          { label: "ALERTA", val: totalAlerta, cls: "border", style: { color: "hsl(48 100% 55%)", borderColor: "hsl(48 100% 50% / 0.4)" } },
        ].map((c: any) => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`} style={c.style}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.5rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {alertasList.filter(a => a.ativo).length > 0 && (
        <div
          className="glass-card rounded-2xl p-4 sm:p-5 space-y-3"
          style={{
            background: "linear-gradient(135deg, hsl(48 100% 50% / 0.08), hsl(48 100% 50% / 0.02))",
            borderColor: "hsl(48 100% 50% / 0.4)",
            boxShadow: "0 0 24px hsl(48 100% 50% / 0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" style={{ color: "hsl(48 100% 55%)" }} />
            <h2 className="font-orbitron text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(48 100% 55%)" }}>
              PLACAS EM ALERTA ({alertasList.filter(a => a.ativo).length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertasList.filter(a => a.ativo).map(a => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2 border"
                style={{ background: "hsl(48 100% 50% / 0.12)", borderColor: "hsl(48 100% 50% / 0.5)" }}
              >
                <Bell className="h-3.5 w-3.5" style={{ color: "hsl(48 100% 55%)" }} />
                <div className="flex flex-col">
                  <span className="font-mono-neon text-sm font-bold" style={{ color: "hsl(48 100% 65%)" }}>
                    {a.placa.replace(/-/g, "")}
                  </span>
                  {a.motivo && (
                    <span className="text-[0.6rem] font-orbitron uppercase opacity-80" style={{ color: "hsl(48 100% 70%)" }}>
                      ⚠ {a.motivo}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => openEdit(a)}
                  className="ml-2 h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "hsl(48 100% 50% / 0.2)", color: "hsl(48 100% 65%)" }}
                  title="EDITAR"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removerAlerta(a.id)}
                  className="h-7 w-7 rounded-full flex items-center justify-center bg-destructive/20 text-destructive hover:bg-destructive/40 transition-all hover:scale-110"
                  title="DESATIVAR"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              ) : sorted.map(r => {
                const motivoAlerta = alertas[normPlaca(r.placa)];
                const isAlerta = !!motivoAlerta && r.status !== "Bloqueio";
                return (
                <TableRow
                  key={r.id}
                  className={cn("border-border/20 table-row-glow", r.status === "Bloqueio" && "bg-destructive/10")}
                  style={isAlerta ? { background: "hsl(48 100% 50% / 0.18)", boxShadow: "inset 0 0 0 1px hsl(48 100% 50% / 0.5)" } : undefined}
                >
                  <TableCell className="font-mono-neon text-sm" style={isAlerta ? { color: "hsl(48 100% 60%)" } : undefined}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isAlerta && <Bell className="h-3.5 w-3.5" style={{ color: "hsl(48 100% 55%)" }} />}
                      <span className={isAlerta ? "" : "text-accent"}>{removeDash(r.placa)}</span>
                      {(() => {
                        const diasRaw = diasMap[(r.placa || "").toUpperCase()] ?? 0;
                        const dias = Math.max(1, diasRaw + 1);
                        return (
                          <span
                            className="text-[0.55rem] font-orbitron font-bold uppercase px-1.5 py-0.5 rounded-md"
                            style={{
                              background: "hsl(210 100% 50% / 0.18)",
                              color: "hsl(210 100% 70%)",
                              border: "1px solid hsl(210 100% 50% / 0.5)",
                              boxShadow: "0 0 8px hsl(210 100% 50% / 0.3)",
                            }}
                            title="DIAS NA EMPRESA"
                          >
                            🔵 {dias}D
                          </span>
                        );
                      })()}
                    </div>
                  </TableCell>
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
                    {isAlerta && (
                      <p className="text-[0.6rem] mt-0.5 font-orbitron uppercase font-bold" style={{ color: "hsl(48 100% 55%)" }}>⚠ {motivoAlerta}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{r.eixo}</TableCell>
                  <TableCell className="text-sm">{r.modelo}</TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editAlerta} onOpenChange={(o) => !o && setEditAlerta(null)}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-orbitron uppercase tracking-wider" style={{ color: "hsl(48 100% 60%)" }}>
              ✏️ EDITAR PLACA EM ALERTA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-orbitron text-[0.65rem] uppercase text-muted-foreground tracking-widest">PLACA</label>
              <Input
                value={editPlaca}
                onChange={e => setEditPlaca(e.target.value.toUpperCase())}
                className="font-mono-neon text-center text-lg uppercase bg-input border-border/50 mt-1"
                maxLength={8}
              />
            </div>
            <div>
              <label className="font-orbitron text-[0.65rem] uppercase text-muted-foreground tracking-widest">MOTIVO</label>
              <Input
                value={editMotivo}
                onChange={e => setEditMotivo(e.target.value.toUpperCase())}
                className="uppercase bg-input border-border/50 mt-1"
                placeholder="MOTIVO DO ALERTA"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditAlerta(null)} className="gap-1.5">
              <X className="h-4 w-4" /> CANCELAR
            </Button>
            <Button onClick={saveEdit} className="gap-1.5 bg-accent hover:bg-accent/80 text-accent-foreground">
              <Check className="h-4 w-4" /> SALVAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
