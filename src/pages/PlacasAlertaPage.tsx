import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Trash2, Plus } from "lucide-react";
import PlacaInput from "@/components/PlacaInput";
import { toast } from "sonner";

interface PlacaAlerta {
  id: string;
  placa: string;
  motivo: string;
  ativo: boolean;
  created_at: string;
}

export default function PlacasAlertaPage() {
  const [lista, setLista] = useState<PlacaAlerta[]>([]);
  const [placa, setPlaca] = useState("");
  const [motivo, setMotivo] = useState("");

  const carregar = async () => {
    const { data } = await supabase.from("placas_alerta" as any).select("*").order("created_at", { ascending: false });
    setLista((data as any) || []);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!placa) { toast.error("INFORME A PLACA!"); return; }
    const { error } = await supabase.from("placas_alerta" as any).insert({
      placa: placa.toUpperCase(),
      motivo: motivo.toUpperCase(),
      ativo: true,
    } as any);
    if (error) { toast.error("ERRO AO SALVAR!"); return; }
    toast.success("PLACA DE ALERTA CADASTRADA!");
    setPlaca(""); setMotivo("");
    carregar();
  };

  const remover = async (id: string) => {
    await supabase.from("placas_alerta" as any).delete().eq("id", id);
    toast.success("REMOVIDA!");
    carregar();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold uppercase flex items-center gap-2" style={{ color: "hsl(48 100% 50%)", textShadow: "0 0 10px hsl(48 100% 50% / 0.6)" }}>
        <AlertTriangle className="h-5 w-5" /> PLACAS DE ALERTA
      </h1>

      <div className="glass-card rounded-2xl p-5 space-y-4 border" style={{ borderColor: "hsl(48 100% 50% / 0.3)" }}>
        <p className="text-xs font-orbitron uppercase text-muted-foreground">
          Cadastre placas para destacar em <span style={{ color: "hsl(48 100% 50%)" }}>AMARELO</span> no monitoramento.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PlacaInput value={placa} onChange={setPlaca} />
          <Input
            placeholder="MOTIVO (OPCIONAL)"
            value={motivo}
            onChange={e => setMotivo(e.target.value.toUpperCase())}
            className="uppercase font-orbitron h-12 bg-input border-border/50"
          />
        </div>
        <Button onClick={salvar} className="w-full gap-2 font-orbitron font-bold uppercase h-12" style={{ background: "hsl(48 100% 50%)", color: "#000" }}>
          <Plus className="h-4 w-4" /> ADICIONAR ALERTA
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h2 className="font-orbitron text-xs uppercase font-bold" style={{ color: "hsl(48 100% 50%)" }}>
            PLACAS CADASTRADAS ({lista.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="font-orbitron text-[0.65rem] uppercase">PLACA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">MOTIVO</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase w-16">AÇÃO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-orbitron text-xs uppercase">NENHUMA PLACA CADASTRADA</TableCell></TableRow>
            ) : lista.map(p => (
              <TableRow key={p.id} className="border-border/20">
                <TableCell className="font-mono-neon text-sm" style={{ color: "hsl(48 100% 55%)" }}>{p.placa}</TableCell>
                <TableCell className="text-xs uppercase">{p.motivo || "-"}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remover(p.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
