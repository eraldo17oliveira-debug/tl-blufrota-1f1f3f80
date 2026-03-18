import { useState, useEffect } from "react";
import { salvarRodizio, lerRodizio, todayStr } from "@/lib/storage";
import { RodizioRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, FileText, X } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Axle position definitions
const CAVALO_EIXOS = [
  {
    nome: "1º EIXO — DIREÇÃO",
    posicoes: [
      { id: "CAV-1E-ESQ", label: "ESQUERDO" },
      { id: "CAV-1E-DIR", label: "DIREITO" },
    ],
  },
  {
    nome: "2º EIXO — TRAÇÃO (DUPLO)",
    posicoes: [
      { id: "CAV-2E-EE", label: "ESQ EXTERNO" },
      { id: "CAV-2E-EI", label: "ESQ INTERNO" },
      { id: "CAV-2E-DI", label: "DIR INTERNO" },
      { id: "CAV-2E-DE", label: "DIR EXTERNO" },
    ],
  },
  {
    nome: "3º EIXO — TRUCK (DUPLO)",
    posicoes: [
      { id: "CAV-3E-EE", label: "ESQ EXTERNO" },
      { id: "CAV-3E-EI", label: "ESQ INTERNO" },
      { id: "CAV-3E-DI", label: "DIR INTERNO" },
      { id: "CAV-3E-DE", label: "DIR EXTERNO" },
    ],
  },
];

const CARRETA_EIXOS = [
  {
    nome: "1º EIXO CARRETA (DUPLO)",
    posicoes: [
      { id: "CAR-1E-EE", label: "ESQ EXTERNO" },
      { id: "CAR-1E-EI", label: "ESQ INTERNO" },
      { id: "CAR-1E-DI", label: "DIR INTERNO" },
      { id: "CAR-1E-DE", label: "DIR EXTERNO" },
    ],
  },
  {
    nome: "2º EIXO CARRETA (DUPLO)",
    posicoes: [
      { id: "CAR-2E-EE", label: "ESQ EXTERNO" },
      { id: "CAR-2E-EI", label: "ESQ INTERNO" },
      { id: "CAR-2E-DI", label: "DIR INTERNO" },
      { id: "CAR-2E-DE", label: "DIR EXTERNO" },
    ],
  },
  {
    nome: "3º EIXO CARRETA (DUPLO)",
    posicoes: [
      { id: "CAR-3E-EE", label: "ESQ EXTERNO" },
      { id: "CAR-3E-EI", label: "ESQ INTERNO" },
      { id: "CAR-3E-DI", label: "DIR INTERNO" },
      { id: "CAR-3E-DE", label: "DIR EXTERNO" },
    ],
  },
];

export default function RodizioPage() {
  const [placa, setPlaca] = useState("");
  const [km, setKm] = useState("");
  const [de, setDe] = useState(todayStr());
  const [ate, setAte] = useState(todayStr());
  const [records, setRecords] = useState<RodizioRecord[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState("");
  const [numFogo, setNumFogo] = useState("");
  const [lacre, setLacre] = useState("");
  const [sulco, setSulco] = useState("");
  const [tipo, setTipo] = useState<"ENTRADA" | "SAÍDA">("ENTRADA");

  // Track recently saved positions
  const [recentPositions, setRecentPositions] = useState<Set<string>>(new Set());

  const load = () => setRecords(lerRodizio(de, ate));
  useEffect(() => { load(); }, [de, ate]);

  const openModal = (posId: string) => {
    if (!placa) { toast.error("INFORME A PLACA PRIMEIRO!"); return; }
    setSelectedPos(posId);
    setNumFogo("");
    setLacre("");
    setSulco("");
    setTipo("ENTRADA");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!numFogo) { toast.error("INFORME O NÚMERO DE FOGO!"); return; }
    salvarRodizio({
      placa: placa.toUpperCase(),
      km,
      posicao: selectedPos,
      numFogo,
      lacre,
      sulco,
      tipo,
    });
    setRecentPositions(prev => new Set(prev).add(selectedPos));
    toast.success(`POSIÇÃO ${selectedPos} REGISTRADA!`);
    setModalOpen(false);
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — RODÍZIO DE PNEUS — ${de} A ${ate}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["TIPO", "PLACA", "KM", "POSIÇÃO", "Nº FOGO", "LACRE", "SULCO (MM)", "DATA"]],
      body: records.map(r => [
        r.tipo, r.placa, r.km, r.posicao, r.numFogo, r.lacre, r.sulco,
        new Date(r.timestamp).toLocaleDateString("pt-BR"),
      ]),
    });
    doc.save(`rodizio_${de}_${ate}.pdf`);
  };

  const getPosColor = (posId: string) => {
    if (recentPositions.has(posId)) return "bg-[hsl(var(--neon-orange))] text-primary-foreground border-transparent shadow-[0_0_12px_hsl(var(--neon-orange)/0.6)]";
    // Check if there's a record for this position today
    const hasRecord = records.some(r => r.posicao === posId && r.placa === placa.toUpperCase());
    if (hasRecord) return "bg-accent text-accent-foreground border-transparent neon-glow-green";
    return "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground";
  };

  const renderAxleGroup = (title: string, eixos: typeof CAVALO_EIXOS, icon: string) => (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
      <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase tracking-wider">
        {icon} {title}
      </h2>
      {eixos.map(eixo => (
        <div key={eixo.nome} className="space-y-2">
          <p className="font-orbitron text-[0.6rem] text-muted-foreground uppercase tracking-widest">
            {eixo.nome}
          </p>
          <div className={`grid gap-2 ${eixo.posicoes.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {eixo.posicoes.map(pos => (
              <button
                key={pos.id}
                onClick={() => openModal(pos.id)}
                className={`rounded-xl border px-2 py-4 text-[0.6rem] sm:text-[0.7rem] font-bold font-orbitron transition-all duration-300 uppercase active:scale-95 ${getPosColor(pos.id)}`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">🔄 RODÍZIO DE PNEUS</h1>

      {/* Placa & KM header */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest">IDENTIFICAÇÃO DO VEÍCULO</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="PLACA"
            value={placa}
            onChange={e => { setPlaca(e.target.value); setRecentPositions(new Set()); }}
            className="uppercase text-center font-mono-neon text-primary bg-input border-border/50 focus:border-primary h-14 text-lg"
          />
          <Input
            placeholder="KM ATUAL"
            value={km}
            onChange={e => setKm(e.target.value)}
            type="number"
            className="text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-sm"
          />
        </div>
      </div>

      {/* Axle Maps */}
      {renderAxleGroup("MAPA DO CAVALÃO (3 EIXOS)", CAVALO_EIXOS, "🚛")}
      {renderAxleGroup("MAPA DA CARRETA (3 EIXOS)", CARRETA_EIXOS, "🚚")}

      {/* Position Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary neon-text text-sm uppercase">
              POSIÇÃO: {selectedPos}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <OptionGroup
              label="TIPO DE MOVIMENTAÇÃO"
              value={tipo}
              onChange={v => setTipo(v as "ENTRADA" | "SAÍDA")}
              colorClass="bg-[hsl(var(--primary))] text-primary-foreground"
              glowClass="neon-glow-primary"
              options={[
                { label: "ENTRADA", value: "ENTRADA" },
                { label: "SAÍDA", value: "SAÍDA" },
              ]}
            />
            <Input
              placeholder="NÚMERO DE FOGO"
              value={numFogo}
              onChange={e => setNumFogo(e.target.value)}
              className="text-center font-orbitron text-sm bg-input border-border/50 focus:border-primary h-14 uppercase"
            />
            <Input
              placeholder="NÚMERO DO LACRE"
              value={lacre}
              onChange={e => setLacre(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 uppercase"
            />
            <Input
              placeholder="MEDIDA DO SULCO (MM)"
              value={sulco}
              onChange={e => setSulco(e.target.value)}
              type="number"
              className="text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-sm"
            />
            <Button
              onClick={handleSave}
              className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase"
            >
              REGISTRAR ✅
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Records Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">REGISTROS</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={de} onChange={e => setDe(e.target.value)} className="w-auto text-xs bg-input border-border/50 font-orbitron" />
            <span className="text-muted-foreground text-xs">A</span>
            <Input type="date" value={ate} onChange={e => setAte(e.target.value)} className="w-auto text-xs bg-input border-border/50 font-orbitron" />
            <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs neon-glow-primary uppercase">
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TIPO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] text-primary uppercase">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">KM</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">POSIÇÃO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">Nº FOGO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">LACRE</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">SULCO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">DATA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM REGISTRO.</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id} className="border-border/20">
                  <TableCell className={`text-xs font-bold uppercase ${r.tipo === "ENTRADA" ? "text-accent" : "text-destructive"}`}>{r.tipo}</TableCell>
                  <TableCell className="font-mono-neon text-primary text-sm uppercase">{r.placa}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.km}</TableCell>
                  <TableCell className="text-[0.65rem] font-orbitron text-[hsl(var(--neon-purple))]">{r.posicao}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.numFogo}</TableCell>
                  <TableCell className="text-sm">{r.lacre}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.sulco}</TableCell>
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
