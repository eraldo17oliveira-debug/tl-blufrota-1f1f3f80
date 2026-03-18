import { useState, useEffect } from "react";
import { salvarRodizio, lerRodizio, todayStr } from "@/lib/storage";
import { RodizioRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, FileText, Plus } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RodizioPage() {
  const [placa, setPlaca] = useState("");
  const [numFogo, setNumFogo] = useState("");
  const [lacre, setLacre] = useState("");
  const [km, setKm] = useState("");
  const [sulco, setSulco] = useState("");
  const [posicao, setPosicao] = useState("");
  const [tipo, setTipo] = useState<"ENTRADA" | "SAÍDA">("ENTRADA");
  const [de, setDe] = useState(todayStr());
  const [ate, setAte] = useState(todayStr());
  const [records, setRecords] = useState<RodizioRecord[]>([]);

  const load = () => setRecords(lerRodizio(de, ate));
  useEffect(() => { load(); }, [de, ate]);

  const handleSave = () => {
    if (!placa || !numFogo) { toast.error("Informe placa e Nº de fogo!"); return; }
    salvarRodizio({ placa: placa.toUpperCase(), numFogo, lacre, km, sulco, posicao, tipo });
    toast.success("Rodízio registrado!");
    setPlaca(""); setNumFogo(""); setLacre(""); setKm(""); setSulco(""); setPosicao("");
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — Rodízio — ${de} a ${ate}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["Tipo", "Placa", "Nº Fogo", "Lacre", "KM", "Sulco (mm)", "Posição", "Data"]],
      body: records.map(r => [
        r.tipo, r.placa, r.numFogo, r.lacre, r.km, r.sulco, r.posicao,
        new Date(r.timestamp).toLocaleDateString("pt-BR"),
      ]),
    });
    doc.save(`rodizio_${de}_${ate}.pdf`);
  };

  const posicoes = [
    { label: "DE-1", value: "DE-1" }, { label: "DE-2", value: "DE-2" }, { label: "DE-3", value: "DE-3" },
    { label: "DD-1", value: "DD-1" }, { label: "DD-2", value: "DD-2" }, { label: "DD-3", value: "DD-3" },
    { label: "TE-1", value: "TE-1" }, { label: "TE-2", value: "TE-2" }, { label: "TE-3", value: "TE-3" },
    { label: "TD-1", value: "TD-1" }, { label: "TD-2", value: "TD-2" }, { label: "TD-3", value: "TD-3" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text">🔄 Rodízio de Pneus</h1>

      <div className="glass-card rounded-2xl p-5 space-y-5">
        <OptionGroup label="Tipo" value={tipo} onChange={v => setTipo(v as "ENTRADA" | "SAÍDA")}
          colorClass="bg-[hsl(var(--primary))] text-primary-foreground" glowClass="neon-glow-primary"
          options={[{ label: "Entrada", value: "ENTRADA" }, { label: "Saída", value: "SAÍDA" }]} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input placeholder="Placa" value={placa} onChange={e => setPlaca(e.target.value)}
            className="uppercase text-center font-mono-neon text-primary bg-input border-border/50 focus:border-primary h-12" />
          <Input placeholder="Nº Fogo" value={numFogo} onChange={e => setNumFogo(e.target.value)}
            className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
          <Input placeholder="Lacre" value={lacre} onChange={e => setLacre(e.target.value)}
            className="text-center bg-input border-border/50 focus:border-primary h-12" />
          <Input placeholder="KM" value={km} onChange={e => setKm(e.target.value)} type="number"
            className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
          <Input placeholder="Sulco (mm)" value={sulco} onChange={e => setSulco(e.target.value)} type="number"
            className="text-center bg-input border-border/50 focus:border-primary h-12 font-orbitron text-sm" />
        </div>

        <div className="space-y-2">
          <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest">Posição no Eixo (Mapa 3 Eixos)</p>
          <div className="grid grid-cols-6 gap-2">
            {posicoes.map(p => (
              <button key={p.value} onClick={() => setPosicao(p.value)}
                className={`rounded-lg border px-2 py-3 text-[0.65rem] font-bold transition-all duration-300 ${
                  posicao === p.value
                    ? "bg-[hsl(var(--primary))] text-primary-foreground border-transparent neon-glow-primary"
                    : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/50"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300">
          <Plus className="h-5 w-5" /> REGISTRAR RODÍZIO ✅
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            <h2 className="font-orbitron text-sm font-bold text-primary neon-text">REGISTROS</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={de} onChange={e => setDe(e.target.value)} className="w-auto text-xs bg-input border-border/50 font-orbitron" />
            <span className="text-muted-foreground text-xs">a</span>
            <Input type="date" value={ate} onChange={e => setAte(e.target.value)} className="w-auto text-xs bg-input border-border/50 font-orbitron" />
            <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs neon-glow-primary">
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.65rem]">Tipo</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] text-primary">Placa</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">Fogo</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">Lacre</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">KM</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">Sulco</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">Posição</TableHead>
                <TableHead className="font-orbitron text-[0.65rem]">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs">Nenhum registro.</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id} className="border-border/20">
                  <TableCell className={`text-xs font-bold ${r.tipo === "ENTRADA" ? "text-accent" : "text-destructive"}`}>{r.tipo}</TableCell>
                  <TableCell className="font-mono-neon text-primary text-sm">{r.placa}</TableCell>
                  <TableCell className="text-sm">{r.numFogo}</TableCell>
                  <TableCell className="text-sm">{r.lacre}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.km}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.sulco}</TableCell>
                  <TableCell className="text-sm">{r.posicao}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
