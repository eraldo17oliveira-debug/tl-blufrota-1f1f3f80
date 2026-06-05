import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Trash2, FileDown, Check, X } from "lucide-react";
import PlacaInput from "@/components/PlacaInput";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Orcamento {
  id: string;
  tipo: "15" | "70";
  data: string;
  placa: string;
  frota: string | null;
  servicos: string | null;
  realizado_por: string | null;
  valor: number;
  pago: boolean;
  created_at: string;
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// returns YYYY-Www key for grouping
function semanaKey(dataISO: string) {
  const d = new Date(dataISO + "T00:00:00");
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${dt.getUTCFullYear()}-S${String(weekNum).padStart(2, "0")}`;
}

function rangeSemana(dataISO: string) {
  const d = new Date(dataISO + "T00:00:00");
  const day = d.getDay() || 7;
  const ini = new Date(d); ini.setDate(d.getDate() - (day - 1));
  const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString("pt-BR");
  return `${fmt(ini)} - ${fmt(fim)}`;
}

function Painel({ tipo }: { tipo: "15" | "70" }) {
  const pct = tipo === "15" ? 0.15 : 0.70;
  const cor = tipo === "15" ? "hsl(0 90% 60%)" : "hsl(140 80% 50%)";
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    placa: "",
    frota: "",
    servicos: "",
    realizado_por: "",
    valor: "",
  });

  const carregar = async () => {
    const { data } = await supabase
      .from("orcamentos" as any)
      .select("*")
      .eq("tipo", tipo)
      .order("data", { ascending: false });
    setLista((data as any) || []);
  };
  useEffect(() => { carregar(); }, [tipo]);

  const salvar = async () => {
    if (!form.placa || !form.valor) {
      toast.error("INFORME PLACA E VALOR!"); return;
    }
    const { error } = await supabase.from("orcamentos" as any).insert({
      tipo,
      data: form.data,
      placa: form.placa.toUpperCase(),
      frota: form.frota.toUpperCase(),
      servicos: form.servicos.toUpperCase(),
      realizado_por: form.realizado_por.toUpperCase(),
      valor: Number(form.valor.replace(",", ".")),
      pago: false,
    } as any);
    if (error) { toast.error("ERRO AO SALVAR!"); return; }
    toast.success("ORÇAMENTO CADASTRADO!");
    setForm({ ...form, placa: "", frota: "", servicos: "", realizado_por: "", valor: "" });
    carregar();
  };

  const togglePago = async (o: Orcamento) => {
    await supabase.from("orcamentos" as any).update({ pago: !o.pago }).eq("id", o.id);
    carregar();
  };

  const remover = async (id: string) => {
    if (!confirm("EXCLUIR ORÇAMENTO?")) return;
    await supabase.from("orcamentos" as any).delete().eq("id", id);
    toast.success("EXCLUÍDO!");
    carregar();
  };

  const semanas = useMemo(() => {
    const map = new Map<string, Orcamento[]>();
    for (const o of lista) {
      const k = semanaKey(o.data);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [lista]);

  const exportPDF = (semana: string, itens: Orcamento[]) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`ORÇAMENTOS ${tipo}% — ${semana}`, 14, 14);
    doc.setFontSize(10);
    doc.text(`Período: ${rangeSemana(itens[0].data)}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["DATA", "PLACA", "FROTA", "SERVIÇOS", "POR", "VALOR", `${tipo}%`, "PAGO"]],
      body: itens.map(o => [
        new Date(o.data + "T00:00:00").toLocaleDateString("pt-BR"),
        o.placa, o.frota || "-", o.servicos || "-", o.realizado_por || "-",
        fmtBRL(o.valor), fmtBRL(o.valor * pct), o.pago ? "SIM" : "NÃO",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: tipo === "15" ? [200, 30, 30] : [30, 160, 60] },
    });
    const totalValor = itens.reduce((s, o) => s + Number(o.valor), 0);
    const totalPct = totalValor * pct;
    const totalPago = itens.filter(o => o.pago).reduce((s, o) => s + Number(o.valor) * pct, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.text(`TOTAL: ${fmtBRL(totalValor)}`, 14, finalY);
    doc.text(`${tipo}% TOTAL: ${fmtBRL(totalPct)}`, 14, finalY + 6);
    doc.text(`${tipo}% PAGO: ${fmtBRL(totalPago)}   |   PENDENTE: ${fmtBRL(totalPct - totalPago)}`, 14, finalY + 12);
    doc.save(`orcamento_${tipo}pct_${semana}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-3 border" style={{ borderColor: `${cor} / 0.3` }}>
        <h3 className="font-orbitron text-xs uppercase font-bold" style={{ color: cor }}>
          NOVO ORÇAMENTO {tipo}%
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
            className="font-orbitron h-11 bg-input border-border/50" />
          <PlacaInput value={form.placa} onChange={v => setForm({ ...form, placa: v })} />
          <Input placeholder="FROTA" value={form.frota}
            onChange={e => setForm({ ...form, frota: e.target.value.toUpperCase() })}
            className="uppercase font-orbitron h-11 bg-input border-border/50" />
          <Input placeholder="REALIZADO POR" value={form.realizado_por}
            onChange={e => setForm({ ...form, realizado_por: e.target.value.toUpperCase() })}
            className="uppercase font-orbitron h-11 bg-input border-border/50" />
          <Input placeholder="VALOR (R$)" inputMode="decimal" value={form.valor}
            onChange={e => setForm({ ...form, valor: e.target.value.replace(/[^0-9.,]/g, "") })}
            className="font-orbitron h-11 bg-input border-border/50 sm:col-span-2" />
          <Textarea placeholder="SERVIÇOS REALIZADOS" value={form.servicos}
            onChange={e => setForm({ ...form, servicos: e.target.value.toUpperCase() })}
            className="uppercase font-orbitron bg-input border-border/50 sm:col-span-2 min-h-[70px]" />
        </div>
        <Button onClick={salvar} className="w-full gap-2 font-orbitron font-bold uppercase h-11"
          style={{ background: cor, color: "#000" }}>
          <Plus className="h-4 w-4" /> ADICIONAR
        </Button>
      </div>

      {semanas.length === 0 && (
        <div className="text-center py-10 text-muted-foreground font-orbitron text-xs uppercase">
          NENHUM ORÇAMENTO REGISTRADO
        </div>
      )}

      {semanas.map(([sem, itens]) => {
        const total = itens.reduce((s, o) => s + Number(o.valor), 0);
        const totalPct = total * pct;
        const pago = itens.filter(o => o.pago).reduce((s, o) => s + Number(o.valor) * pct, 0);
        return (
          <div key={sem} className="glass-card rounded-2xl overflow-hidden border" style={{ borderColor: `${cor.replace(")", " / 0.25)")}` }}>
            <div className="p-3 border-b border-border/30 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-orbitron text-xs font-bold uppercase" style={{ color: cor }}>
                  {sem} • {rangeSemana(itens[0].data)}
                </div>
                <div className="text-[0.65rem] text-muted-foreground font-orbitron uppercase">
                  TOTAL: {fmtBRL(total)} • {tipo}% PAGO: {fmtBRL(pago)} / PEND: {fmtBRL(totalPct - pago)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg font-orbitron text-sm font-bold"
                  style={{ background: `${cor.replace(")", " / 0.15)")}`, color: cor, border: `1px solid ${cor.replace(")", " / 0.5)")}`, textShadow: `0 0 8px ${cor.replace(")", " / 0.6)")}` }}>
                  {tipo}%: {fmtBRL(totalPct)}
                </div>
                <Button size="sm" variant="ghost" onClick={() => exportPDF(sem, itens)} className="gap-1 font-orbitron uppercase text-xs">
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="font-orbitron text-[0.6rem] uppercase">DATA</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase">PLACA</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase">FROTA</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase">SERVIÇOS</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase">POR</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase text-right">VALOR</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase text-right">{tipo}%</TableHead>
                    <TableHead className="font-orbitron text-[0.6rem] uppercase text-center">PAGO</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map(o => (
                    <TableRow key={o.id} className="border-border/20">
                      <TableCell className="text-[0.7rem] font-orbitron">
                        {new Date(o.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono-neon text-sm">{o.placa}</TableCell>
                      <TableCell className="text-xs">{o.frota || "-"}</TableCell>
                      <TableCell className="text-[0.7rem] max-w-[200px] truncate" title={o.servicos || ""}>{o.servicos || "-"}</TableCell>
                      <TableCell className="text-[0.7rem]">{o.realizado_por || "-"}</TableCell>
                      <TableCell className="text-right font-orbitron text-xs">{fmtBRL(Number(o.valor))}</TableCell>
                      <TableCell className="text-right font-orbitron text-sm font-bold"
                        style={{ color: cor, textShadow: `0 0 6px ${cor.replace(")", " / 0.6)")}` }}>
                        {fmtBRL(Number(o.valor) * pct)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="icon" variant="ghost" onClick={() => togglePago(o)}
                          className={`h-7 w-7 ${o.pago ? "text-green-500" : "text-muted-foreground"}`}>
                          {o.pago ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remover(o.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrcamentosPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold uppercase flex items-center gap-2 text-primary neon-text">
        <DollarSign className="h-5 w-5" /> ORÇAMENTOS
      </h1>
      <Tabs defaultValue="15" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-card/50">
          <TabsTrigger value="15" className="font-orbitron uppercase data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            15%
          </TabsTrigger>
          <TabsTrigger value="70" className="font-orbitron uppercase data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            70%
          </TabsTrigger>
        </TabsList>
        <TabsContent value="15" className="mt-4"><Painel tipo="15" /></TabsContent>
        <TabsContent value="70" className="mt-4"><Painel tipo="70" /></TabsContent>
      </Tabs>
    </div>
  );
}
