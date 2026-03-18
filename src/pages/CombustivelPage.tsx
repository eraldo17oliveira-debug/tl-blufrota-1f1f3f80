import { useState, useEffect } from "react";
import { salvarFechamento, lerFechamentos, salvarCarga, lerCargas, volumeAtual } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fuel, Plus, TrendingDown, Droplets } from "lucide-react";
import { toast } from "sonner";
import { todayStr } from "@/lib/storage";

export default function CombustivelPage() {
  const [data, setData] = useState(todayStr());
  const [leituraInicial, setLeituraInicial] = useState("");
  const [leituraFinal, setLeituraFinal] = useState("");
  const [litros, setLitros] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [fechamentos, setFechamentos] = useState<ReturnType<typeof lerFechamentos>>([]);
  const [cargas, setCargas] = useState<ReturnType<typeof lerCargas>>([]);
  const [volume, setVolume] = useState(0);

  const load = () => {
    setFechamentos(lerFechamentos());
    setCargas(lerCargas());
    setVolume(volumeAtual());
  };
  useEffect(() => { load(); }, []);

  const handleFechamento = () => {
    const li = parseFloat(leituraInicial);
    const lf = parseFloat(leituraFinal);
    if (isNaN(li) || isNaN(lf)) { toast.error("Informe as leituras!"); return; }
    if (lf < li) { toast.error("Leitura final menor que inicial!"); return; }
    salvarFechamento({ data, leituraInicial: li, leituraFinal: lf });
    toast.success("Fechamento registrado!");
    setLeituraInicial(""); setLeituraFinal("");
    load();
  };

  const handleCarga = () => {
    const l = parseFloat(litros);
    if (isNaN(l) || l <= 0) { toast.error("Informe os litros!"); return; }
    salvarCarga({ litros: l, fornecedor, notaFiscal });
    toast.success("Carga registrada!");
    setLitros(""); setFornecedor(""); setNotaFiscal("");
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text">⛽ Combustível</h1>

      {/* Dashboard Volume */}
      <div className="glass-card-glow rounded-2xl p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center neon-glow-primary">
          <Droplets className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-orbitron uppercase">Volume Atual no Tanque</p>
          <p className="text-3xl font-bold font-orbitron text-primary neon-text">{volume.toLocaleString("pt-BR")} L</p>
        </div>
      </div>

      {/* Fechamento Diário */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[hsl(var(--neon-orange))]" />
          <h2 className="font-orbitron text-sm font-bold text-[hsl(var(--neon-orange))]">FECHAMENTO DIÁRIO</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-input border-border/50 font-orbitron text-xs h-12" />
          <Input placeholder="Leitura Inicial" value={leituraInicial} onChange={e => setLeituraInicial(e.target.value)} type="number"
            className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
          <Input placeholder="Leitura Final" value={leituraFinal} onChange={e => setLeituraFinal(e.target.value)} type="number"
            className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
        </div>
        <Button onClick={handleFechamento} className="w-full gap-2 bg-[hsl(var(--neon-orange))] hover:bg-[hsl(var(--neon-orange))]/80 text-primary-foreground font-orbitron font-bold text-sm h-12 rounded-xl shadow-[0_0_12px_hsl(var(--neon-orange)/0.5)] transition-all duration-300">
          <Plus className="h-4 w-4" /> REGISTRAR FECHAMENTO
        </Button>
      </div>

      {/* Entrada de Carga */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-accent" />
          <h2 className="font-orbitron text-sm font-bold text-accent">ENTRADA DE CARGA</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Litros" value={litros} onChange={e => setLitros(e.target.value)} type="number"
            className="text-center bg-input border-border/50 focus:border-accent h-12 font-orbitron text-sm" />
          <Input placeholder="Fornecedor" value={fornecedor} onChange={e => setFornecedor(e.target.value)}
            className="text-center bg-input border-border/50 focus:border-accent h-12" />
          <Input placeholder="Nota Fiscal" value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)}
            className="text-center bg-input border-border/50 focus:border-accent h-12" />
        </div>
        <Button onClick={handleCarga} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-12 rounded-xl neon-glow-green transition-all duration-300">
          <Plus className="h-4 w-4" /> REGISTRAR CARGA
        </Button>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-orbitron text-xs font-bold text-[hsl(var(--neon-orange))]">FECHAMENTOS</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="font-orbitron text-[0.6rem]">Data</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">Inicial</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">Final</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">Consumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fechamentos.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">Nenhum fechamento.</TableCell></TableRow>
                ) : fechamentos.map(f => (
                  <TableRow key={f.id} className="border-border/20">
                    <TableCell className="text-xs">{f.data}</TableCell>
                    <TableCell className="text-sm font-orbitron">{f.leituraInicial}</TableCell>
                    <TableCell className="text-sm font-orbitron">{f.leituraFinal}</TableCell>
                    <TableCell className="text-sm font-orbitron text-[hsl(var(--neon-orange))]">{f.consumo} L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-orbitron text-xs font-bold text-accent">CARGAS RECEBIDAS</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="font-orbitron text-[0.6rem]">Data</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">Litros</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">Fornecedor</TableHead>
                  <TableHead className="font-orbitron text-[0.6rem]">NF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargas.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">Nenhuma carga.</TableCell></TableRow>
                ) : cargas.map(c => (
                  <TableRow key={c.id} className="border-border/20">
                    <TableCell className="text-xs">{new Date(c.timestamp).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm font-orbitron text-accent">{c.litros} L</TableCell>
                    <TableCell className="text-sm">{c.fornecedor}</TableCell>
                    <TableCell className="text-sm">{c.notaFiscal}</TableCell>
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
