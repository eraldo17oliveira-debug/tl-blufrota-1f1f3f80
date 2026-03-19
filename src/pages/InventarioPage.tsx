import { useState, useEffect } from "react";
import { salvarPneu, lerPneus, atualizarStatusPneu, lerFornecedoresPorTipo, exportCSV } from "@/lib/storage";
import { PneuInventario, PneuStatus, Fornecedor, UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, FileText, FileSpreadsheet } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InventarioPage({ session }: { session: UserSession }) {
  const [numFogo, setNumFogo] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [largura, setLargura] = useState("");
  const [aro, setAro] = useState("");
  const [marca, setMarca] = useState("");
  const [status, setStatus] = useState<PneuStatus>("DISPONÍVEL");
  const [fornecedorId, setFornecedorId] = useState("");
  const [pneus, setPneus] = useState<PneuInventario[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const load = () => { setPneus(lerPneus()); setFornecedores(lerFornecedoresPorTipo("PNEUS / RECAPAGEM")); };
  useEffect(() => { load(); }, []);

  const handleSave = () => {
    if (!numFogo) { toast.error("INFORME O Nº DE FOGO!"); return; }
    const forn = fornecedores.find(f => f.id === fornecedorId);
    salvarPneu({ numFogo, tamanho, largura, aro, marca, status, fornecedorId, fornecedorNome: forn?.razaoSocial || "" });
    toast.success("PNEU CADASTRADO!"); setNumFogo(""); setTamanho(""); setLargura(""); setAro(""); setMarca(""); setFornecedorId(""); load();
  };

  const handleStatusChange = (id: string, newStatus: PneuStatus) => { atualizarStatusPneu(id, newStatus); load(); };

  const statusColor = (s: PneuStatus) => {
    if (s === "DISPONÍVEL") return "text-accent";
    if (s === "RECAPAGEM") return "text-[hsl(var(--neon-orange))]";
    return "text-destructive";
  };

  const contagem = {
    disponivel: pneus.filter(p => p.status === "DISPONÍVEL").length,
    recapagem: pneus.filter(p => p.status === "RECAPAGEM").length,
    sucata: pneus.filter(p => p.status === "SUCATA").length,
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("TL-BLU FROTA — INVENTÁRIO DE PNEUS", 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["Nº FOGO", "TAMANHO", "LARGURA", "ARO", "MARCA", "FORNECEDOR", "STATUS"]],
      body: pneus.map(p => [p.numFogo, p.tamanho, p.largura, p.aro, p.marca, p.fornecedorNome, p.status]),
    });
    doc.save("inventario_pneus.pdf");
  };

  const handleExcel = () => {
    exportCSV("inventario_pneus.csv",
      ["Nº FOGO", "TAMANHO", "LARGURA", "ARO", "MARCA", "FORNECEDOR", "STATUS"],
      pneus.map(p => [p.numFogo, p.tamanho, p.largura, p.aro, p.marca, p.fornecedorNome, p.status])
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">📦 INVENTÁRIO DE PNEUS</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "DISPONÍVEL", val: contagem.disponivel, cls: "text-accent border-accent/30" },
          { label: "RECAPAGEM", val: contagem.recapagem, cls: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))]/30" },
          { label: "SUCATA", val: contagem.sucata, cls: "text-destructive border-destructive/30" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.6rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input placeholder="Nº FOGO" value={numFogo} onChange={e => setNumFogo(e.target.value)} className="text-center font-orbitron text-sm bg-input border-border/50 focus:border-primary h-12 uppercase" />
          <Input placeholder="TAMANHO" value={tamanho} onChange={e => setTamanho(e.target.value)} className="text-center bg-input border-border/50 h-12 uppercase" />
          <Input placeholder="LARGURA" value={largura} onChange={e => setLargura(e.target.value)} className="text-center bg-input border-border/50 h-12 uppercase" />
          <Input placeholder="ARO" value={aro} onChange={e => setAro(e.target.value)} className="text-center bg-input border-border/50 h-12 uppercase" />
          <Input placeholder="MARCA" value={marca} onChange={e => setMarca(e.target.value)} className="text-center bg-input border-border/50 h-12 uppercase" />
          <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} className="bg-input border border-border/50 rounded-xl text-sm p-3 text-foreground h-12 uppercase">
            <option value="">FORNECEDOR</option>
            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.razaoSocial}</option>)}
          </select>
        </div>
        <OptionGroup label="STATUS" value={status} onChange={v => setStatus(v as PneuStatus)} colorClass="bg-accent text-accent-foreground" glowClass="neon-glow-green"
          options={[{ label: "DISPONÍVEL", value: "DISPONÍVEL" }, { label: "RECAPAGEM", value: "RECAPAGEM" }, { label: "SUCATA", value: "SUCATA" }]} />
        <Button onClick={handleSave} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase">
          <Plus className="h-5 w-5" /> CADASTRAR PNEU ✅
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">ESTOQUE</h2>
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
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FOGO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TAMANHO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">LARGURA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">ARO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">MARCA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FORNECEDOR</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">STATUS</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">AÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pneus.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM PNEU CADASTRADO.</TableCell></TableRow>
              ) : pneus.map(p => (
                <TableRow key={p.id} className="border-border/20">
                  <TableCell className="text-sm font-orbitron">{p.numFogo}</TableCell>
                  <TableCell className="text-sm uppercase">{p.tamanho}</TableCell>
                  <TableCell className="text-sm uppercase">{p.largura}</TableCell>
                  <TableCell className="text-sm uppercase">{p.aro}</TableCell>
                  <TableCell className="text-sm uppercase">{p.marca}</TableCell>
                  <TableCell className="text-sm text-muted-foreground uppercase">{p.fornecedorNome || "—"}</TableCell>
                  <TableCell className={`text-xs font-bold uppercase ${statusColor(p.status)}`}>{p.status}</TableCell>
                  <TableCell>
                    <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value as PneuStatus)}
                      className="bg-input border border-border/50 rounded-lg text-xs p-1.5 text-foreground uppercase">
                      <option value="DISPONÍVEL">DISPONÍVEL</option>
                      <option value="RECAPAGEM">RECAPAGEM</option>
                      <option value="SUCATA">SUCATA</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
