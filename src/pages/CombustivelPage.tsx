import { useState, useEffect } from "react";
import { salvarFechamento, lerFechamentos, salvarCarga, lerCargas, volumeAtual, lerFornecedoresPorTipo, exportCSV, todayStr } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fuel, Plus, TrendingDown, Droplets, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CombustivelPage({ session }: { session: UserSession }) {
  const [data, setData] = useState(todayStr());
  const [leituraInicial, setLeituraInicial] = useState("");
  const [leituraFinal, setLeituraFinal] = useState("");
  const [litros, setLitros] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  const [cargas, setCargas] = useState<any[]>([]);
  const [volume, setVolume] = useState(0);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  const load = async () => {
    const [f, c, v, forn] = await Promise.all([
      lerFechamentos(), lerCargas(), volumeAtual(), lerFornecedoresPorTipo("COMBUSTÍVEL")
    ]);
    setFechamentos(f); setCargas(c); setVolume(v); setFornecedores(forn);
  };
  useEffect(() => { load(); }, []);

  const handleFechamento = async () => {
    const li = parseFloat(leituraInicial); const lf = parseFloat(leituraFinal);
    if (isNaN(li) || isNaN(lf)) { toast.error("INFORME AS LEITURAS!"); return; }
    if (lf < li) { toast.error("LEITURA FINAL MENOR QUE INICIAL!"); return; }
    await salvarFechamento({ data, leitura_inicial: li, leitura_final: lf }); toast.success("FECHAMENTO REGISTRADO!"); setLeituraInicial(""); setLeituraFinal(""); load();
  };

  const handleCarga = async () => {
    const l = parseFloat(litros);
    if (isNaN(l) || l <= 0) { toast.error("INFORME OS LITROS!"); return; }
    const forn = fornecedores.find((f: any) => f.id === fornecedorId);
    await salvarCarga({ litros: l, fornecedor_id: fornecedorId, fornecedor_nome: forn?.razao_social || "", nota_fiscal: notaFiscal }); toast.success("CARGA REGISTRADA!"); setLitros(""); setFornecedorId(""); setNotaFiscal(""); load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" }); doc.setFontSize(14); doc.text("TL-BLU FROTA — COMBUSTÍVEL", 14, 18);
    autoTable(doc, { startY: 25, head: [["DATA", "LEITURA INICIAL", "LEITURA FINAL", "CONSUMO"]], body: fechamentos.map(f => [f.data, f.leitura_inicial, f.leitura_final, `${f.consumo} L`]) });
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.text("CARGAS RECEBIDAS", 14, y); y += 7;
    autoTable(doc, { startY: y, head: [["DATA", "LITROS", "FORNECEDOR", "NF"]], body: cargas.map(c => [new Date(c.created_at).toLocaleDateString("pt-BR"), `${c.litros} L`, c.fornecedor_nome, c.nota_fiscal]) });
    doc.save("combustivel_tlblu.pdf");
  };

  const handleExcel = () => {
    exportCSV("combustivel_tlblu.csv", ["TIPO", "DATA", "VALOR1", "VALOR2", "VALOR3"],
      [...fechamentos.map(f => ["FECHAMENTO", f.data, String(f.leitura_inicial), String(f.leitura_final), `${f.consumo}`]),
       ...cargas.map(c => ["CARGA", new Date(c.created_at).toLocaleDateString("pt-BR"), `${c.litros}`, c.fornecedor_nome, c.nota_fiscal])]);
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">⛽ COMBUSTÍVEL</h1>

      <div className="glass-card-glow rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center neon-glow-primary">
            <Droplets className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-orbitron uppercase">VOLUME ATUAL NO TANQUE</p>
            <p className="text-3xl font-bold font-orbitron text-primary neon-text">{volume.toLocaleString("pt-BR")} L</p>
          </div>
        </div>
        <div className="flex gap-2">
          {session.permissoes.gerarPdf && (
            <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs neon-glow-primary uppercase">
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          )}
          {session.permissoes.gerarExcel && (
            <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10 font-orbitron text-xs neon-glow-green uppercase">
              <FileSpreadsheet className="h-3.5 w-3.5" /> EXCEL
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[hsl(var(--neon-orange))]" />
          <h2 className="font-orbitron text-sm font-bold text-[hsl(var(--neon-orange))] uppercase">FECHAMENTO DIÁRIO</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-input border-border/50 font-orbitron text-xs h-12" />
          <Input placeholder="LEITURA INICIAL" value={leituraInicial} onChange={e => setLeituraInicial(e.target.value)} type="number" className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
          <Input placeholder="LEITURA FINAL" value={leituraFinal} onChange={e => setLeituraFinal(e.target.value)} type="number" className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
        </div>
        <Button onClick={handleFechamento} className="w-full gap-2 bg-[hsl(var(--neon-orange))] hover:bg-[hsl(var(--neon-orange))]/80 text-primary-foreground font-orbitron font-bold text-sm h-12 rounded-xl shadow-[0_0_12px_hsl(var(--neon-orange)/0.5)] transition-all duration-300 uppercase">
          <Plus className="h-4 w-4" /> REGISTRAR FECHAMENTO
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-accent" />
          <h2 className="font-orbitron text-sm font-bold text-accent uppercase">ENTRADA DE CARGA</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="LITROS" value={litros} onChange={e => setLitros(e.target.value)} type="number" className="text-center bg-input border-border/50 focus:border-accent h-12 font-orbitron text-sm" />
          <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} className="bg-input border border-border/50 rounded-xl text-sm p-3 text-foreground font-orbitron h-12 uppercase">
            <option value="">SELECIONE FORNECEDOR</option>
            {fornecedores.map((f: any) => <option key={f.id} value={f.id}>{f.razao_social}</option>)}
          </select>
          <Input placeholder="NOTA FISCAL" value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} className="text-center bg-input border-border/50 focus:border-accent h-12 uppercase" />
        </div>
        <Button onClick={handleCarga} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-12 rounded-xl neon-glow-green transition-all duration-300 uppercase">
          <Plus className="h-4 w-4" /> REGISTRAR CARGA
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30"><h3 className="font-orbitron text-xs font-bold text-[hsl(var(--neon-orange))] uppercase">FECHAMENTOS</h3></div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader><TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">DATA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">INICIAL</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FINAL</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">CONSUMO</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fechamentos.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs uppercase font-orbitron">NENHUM FECHAMENTO.</TableCell></TableRow>
                ) : fechamentos.map(f => (
                  <TableRow key={f.id} className="border-border/20">
                    <TableCell className="text-xs">{f.data}</TableCell>
                    <TableCell className="text-sm font-orbitron">{f.leitura_inicial}</TableCell>
                    <TableCell className="text-sm font-orbitron">{f.leitura_final}</TableCell>
                    <TableCell className="text-sm font-orbitron text-[hsl(var(--neon-orange))]">{f.consumo} L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30"><h3 className="font-orbitron text-xs font-bold text-accent uppercase">CARGAS RECEBIDAS</h3></div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader><TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">DATA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">LITROS</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FORNECEDOR</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">NF</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {cargas.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs uppercase font-orbitron">NENHUMA CARGA.</TableCell></TableRow>
                ) : cargas.map(c => (
                  <TableRow key={c.id} className="border-border/20">
                    <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm font-orbitron text-accent">{c.litros} L</TableCell>
                    <TableCell className="text-sm uppercase">{c.fornecedor_nome}</TableCell>
                    <TableCell className="text-sm uppercase">{c.nota_fiscal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
