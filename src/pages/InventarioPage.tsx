import { useState, useEffect } from "react";
import { salvarPneu, lerPneus, atualizarStatusPneu } from "@/lib/storage";
import { PneuInventario, PneuStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";

export default function InventarioPage() {
  const [numFogo, setNumFogo] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [largura, setLargura] = useState("");
  const [aro, setAro] = useState("");
  const [marca, setMarca] = useState("");
  const [status, setStatus] = useState<PneuStatus>("ESTOQUE");
  const [pneus, setPneus] = useState<PneuInventario[]>([]);

  const load = () => setPneus(lerPneus());
  useEffect(() => { load(); }, []);

  const handleSave = () => {
    if (!numFogo) { toast.error("Informe o Nº de fogo!"); return; }
    salvarPneu({ numFogo, tamanho, largura, aro, marca, status });
    toast.success("Pneu cadastrado!");
    setNumFogo(""); setTamanho(""); setLargura(""); setAro(""); setMarca("");
    load();
  };

  const handleStatusChange = (id: string, newStatus: PneuStatus) => {
    atualizarStatusPneu(id, newStatus);
    load();
  };

  const statusColor = (s: PneuStatus) => {
    if (s === "ESTOQUE") return "text-accent";
    if (s === "RECAPAGEM") return "text-[hsl(var(--neon-orange))]";
    return "text-destructive";
  };

  const contagem = {
    estoque: pneus.filter(p => p.status === "ESTOQUE").length,
    recapagem: pneus.filter(p => p.status === "RECAPAGEM").length,
    sucata: pneus.filter(p => p.status === "SUCATA").length,
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text">📦 Inventário de Pneus</h1>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Estoque", val: contagem.estoque, cls: "text-accent border-accent/30" },
          { label: "Recapagem", val: contagem.recapagem, cls: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))]/30" },
          { label: "Sucata", val: contagem.sucata, cls: "text-destructive border-destructive/30" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.6rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input placeholder="Nº Fogo" value={numFogo} onChange={e => setNumFogo(e.target.value)}
            className="text-center font-orbitron text-sm bg-input border-border/50 focus:border-primary h-12" />
          <Input placeholder="Tamanho" value={tamanho} onChange={e => setTamanho(e.target.value)}
            className="text-center bg-input border-border/50 h-12" />
          <Input placeholder="Largura" value={largura} onChange={e => setLargura(e.target.value)}
            className="text-center bg-input border-border/50 h-12" />
          <Input placeholder="Aro" value={aro} onChange={e => setAro(e.target.value)}
            className="text-center bg-input border-border/50 h-12" />
          <Input placeholder="Marca" value={marca} onChange={e => setMarca(e.target.value)}
            className="text-center bg-input border-border/50 h-12" />
        </div>
        <OptionGroup label="Status" value={status} onChange={v => setStatus(v as PneuStatus)}
          colorClass="bg-accent text-accent-foreground" glowClass="neon-glow-green"
          options={[
            { label: "Estoque", value: "ESTOQUE" },
            { label: "Recapagem", value: "RECAPAGEM" },
            { label: "Sucata", value: "SUCATA" },
          ]} />
        <Button onClick={handleSave} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300">
          <Plus className="h-5 w-5" /> CADASTRAR PNEU ✅
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/30 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text">ESTOQUE</h2>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem]">Fogo</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Tamanho</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Largura</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Aro</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Marca</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Status</TableHead>
                <TableHead className="font-orbitron text-[0.6rem]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pneus.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10 font-orbitron text-xs">Nenhum pneu cadastrado.</TableCell></TableRow>
              ) : pneus.map(p => (
                <TableRow key={p.id} className="border-border/20">
                  <TableCell className="text-sm font-orbitron">{p.numFogo}</TableCell>
                  <TableCell className="text-sm">{p.tamanho}</TableCell>
                  <TableCell className="text-sm">{p.largura}</TableCell>
                  <TableCell className="text-sm">{p.aro}</TableCell>
                  <TableCell className="text-sm">{p.marca}</TableCell>
                  <TableCell className={`text-xs font-bold ${statusColor(p.status)}`}>{p.status}</TableCell>
                  <TableCell>
                    <select
                      value={p.status}
                      onChange={e => handleStatusChange(p.id, e.target.value as PneuStatus)}
                      className="bg-input border border-border/50 rounded-lg text-xs p-1.5 text-foreground"
                    >
                      <option value="ESTOQUE">Estoque</option>
                      <option value="RECAPAGEM">Recapagem</option>
                      <option value="SUCATA">Sucata</option>
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
