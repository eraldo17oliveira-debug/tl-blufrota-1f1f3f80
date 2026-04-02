import { useState, useEffect } from "react";
import { salvarRodizio, lerRodizio, todayStr, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, FileText, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import PlacaInput from "@/components/PlacaInput";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CAVALO_EIXOS = [
  { nome: "1º EIXO — DIREÇÃO", posicoes: [{ id: "CAV-1E-ESQ", label: "ESQUERDO" }, { id: "CAV-1E-DIR", label: "DIREITO" }] },
  { nome: "2º EIXO — TRAÇÃO (DUPLO)", posicoes: [{ id: "CAV-2E-EE", label: "ESQ EXTERNO" }, { id: "CAV-2E-EI", label: "ESQ INTERNO" }, { id: "CAV-2E-DI", label: "DIR INTERNO" }, { id: "CAV-2E-DE", label: "DIR EXTERNO" }] },
  { nome: "3º EIXO — TRUCK (DUPLO)", posicoes: [{ id: "CAV-3E-EE", label: "ESQ EXTERNO" }, { id: "CAV-3E-EI", label: "ESQ INTERNO" }, { id: "CAV-3E-DI", label: "DIR INTERNO" }, { id: "CAV-3E-DE", label: "DIR EXTERNO" }] },
];

const CARRETA_EIXOS = [
  { nome: "1º EIXO CARRETA (DUPLO)", posicoes: [{ id: "CAR-1E-EE", label: "ESQ EXTERNO" }, { id: "CAR-1E-EI", label: "ESQ INTERNO" }, { id: "CAR-1E-DI", label: "DIR INTERNO" }, { id: "CAR-1E-DE", label: "DIR EXTERNO" }] },
  { nome: "2º EIXO CARRETA (DUPLO)", posicoes: [{ id: "CAR-2E-EE", label: "ESQ EXTERNO" }, { id: "CAR-2E-EI", label: "ESQ INTERNO" }, { id: "CAR-2E-DI", label: "DIR INTERNO" }, { id: "CAR-2E-DE", label: "DIR EXTERNO" }] },
  { nome: "3º EIXO CARRETA (DUPLO)", posicoes: [{ id: "CAR-3E-EE", label: "ESQ EXTERNO" }, { id: "CAR-3E-EI", label: "ESQ INTERNO" }, { id: "CAR-3E-DI", label: "DIR INTERNO" }, { id: "CAR-3E-DE", label: "DIR EXTERNO" }] },
];

interface PneuEntry {
  posicao: string;
  numFogo: string;
  lacre: string;
}

export default function RodizioPage({ session }: { session: UserSession }) {
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [de, setDe] = useState(todayStr());
  const [ate, setAte] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);

  // List of tires to register at once
  const [pneus, setPneus] = useState<PneuEntry[]>([]);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  const load = async () => {
    const data = await lerRodizio(de, ate);
    setRecords(data);
  };
  useEffect(() => { load(); }, [de, ate]);

  const selectPosition = (posId: string) => {
    if (!placa) { toast.error("INFORME A PLACA PRIMEIRO!"); return; }
    setSelectedPos(posId);
    // Add entry if not already in list
    if (!pneus.find(p => p.posicao === posId)) {
      setPneus(prev => [...prev, { posicao: posId, numFogo: "", lacre: "" }]);
    }
  };

  const updatePneu = (posId: string, field: "numFogo" | "lacre", value: string) => {
    setPneus(prev => prev.map(p => p.posicao === posId ? { ...p, [field]: value } : p));
  };

  const removePneu = (posId: string) => {
    setPneus(prev => prev.filter(p => p.posicao !== posId));
    if (selectedPos === posId) setSelectedPos(null);
  };

  const handleRegistrarTodos = async () => {
    if (!placa) { toast.error("INFORME A PLACA!"); return; }
    if (pneus.length === 0) { toast.error("SELECIONE AO MENOS UMA POSIÇÃO!"); return; }
    const invalids = pneus.filter(p => !p.numFogo.trim());
    if (invalids.length > 0) { toast.error("PREENCHA O Nº FOGO DE TODAS AS POSIÇÕES!"); return; }

    for (const p of pneus) {
      await salvarRodizio({
        placa: placa.toUpperCase(),
        frota: frota.toUpperCase(),
        posicao: p.posicao,
        num_fogo: p.numFogo.toUpperCase(),
        lacre: p.lacre.toUpperCase(),
        sulco: "",
        tipo: "ENTRADA",
      });
    }
    toast.success(`${pneus.length} PNEU(S) REGISTRADO(S)!`);
    setPneus([]);
    setSelectedPos(null);
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — RODÍZIO DE PNEUS — ${de} A ${ate}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["PLACA", "FROTA", "POSIÇÃO", "Nº FOGO", "LACRE", "DATA"]],
      body: records.map(r => [r.placa, r.frota, r.posicao, r.num_fogo, r.lacre, new Date(r.created_at).toLocaleDateString("pt-BR")]),
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA OPERACIONAL TL-BLU", 14, finalY);
    doc.save(`rodizio_${de}_${ate}.pdf`);
  };

  const handleExcel = () => {
    exportCSV(`rodizio_${de}_${ate}.csv`,
      ["PLACA", "FROTA", "POSIÇÃO", "Nº FOGO", "LACRE", "DATA"],
      records.map(r => [r.placa, r.frota, r.posicao, r.num_fogo, r.lacre, new Date(r.created_at).toLocaleDateString("pt-BR")])
    );
  };

  const isInList = (posId: string) => pneus.some(p => p.posicao === posId);

  const getPosColor = (posId: string) => {
    if (isInList(posId)) return "border-accent bg-accent/20 text-accent shadow-[0_0_12px_hsl(var(--neon-green)/0.4)]";
    return "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground";
  };

  const renderPosition = (pos: { id: string; label: string }) => (
    <button key={pos.id} onClick={() => selectPosition(pos.id)}
      className={`w-full rounded-xl border px-2 py-4 text-[0.65rem] sm:text-xs font-bold font-orbitron transition-all duration-300 uppercase active:scale-95 ${getPosColor(pos.id)}`}>
      {pos.label}
      {isInList(pos.id) && " ✅"}
    </button>
  );

  const renderAxleGroup = (title: string, eixos: typeof CAVALO_EIXOS, icon: string) => (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
      <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase tracking-wider">{icon} {title}</h2>
      {eixos.map(eixo => (
        <div key={eixo.nome} className="space-y-2">
          <p className="font-orbitron text-[0.6rem] text-muted-foreground uppercase tracking-widest">{eixo.nome}</p>
          <div className={`grid gap-2 ${eixo.posicoes.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {eixo.posicoes.map(pos => renderPosition(pos))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">🔄 RODÍZIO DE PNEUS</h1>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest">IDENTIFICAÇÃO DO VEÍCULO</p>
        <div className="grid grid-cols-2 gap-3">
          <PlacaInput value={placa} onChange={(v) => { setPlaca(v); setPneus([]); setSelectedPos(null); }} className="h-14 text-lg" />
          <Input placeholder="NÚMERO DA FROTA" value={frota} onChange={e => setFrota(e.target.value)}
            className="uppercase text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-sm" />
        </div>
      </div>

      {renderAxleGroup("MAPA DO CAVALÃO (3 EIXOS)", CAVALO_EIXOS, "🚛")}
      {renderAxleGroup("MAPA DA CARRETA (3 EIXOS)", CARRETA_EIXOS, "🚚")}

      {/* List of selected tires with num_fogo and lacre fields */}
      {pneus.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-accent" />
            <h2 className="font-orbitron text-sm font-bold text-accent uppercase">PNEUS SELECIONADOS ({pneus.length})</h2>
          </div>
          <div className="space-y-3">
            {pneus.map(p => (
              <div key={p.posicao} className="glass-card rounded-xl p-3 border border-accent/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-xs text-accent font-bold uppercase">{p.posicao}</span>
                  <button onClick={() => removePneu(p.posicao)} className="h-7 w-7 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nº FOGO *" value={p.numFogo} onChange={e => updatePneu(p.posicao, "numFogo", e.target.value)}
                    className="text-center font-orbitron text-xs bg-input border-border/50 focus:border-accent h-11 uppercase" />
                  <Input placeholder="Nº LACRE" value={p.lacre} onChange={e => updatePneu(p.posicao, "lacre", e.target.value)}
                    className="text-center text-xs bg-input border-border/50 focus:border-accent h-11 uppercase" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleRegistrarTodos}
            className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green uppercase tracking-wider">
            REGISTRAR {pneus.length} PNEU(S) ✅
          </Button>
        </div>
      )}

      {/* Records table */}
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
            {session.permissoes.gerarPdf && (
              <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs neon-glow-primary uppercase font-bold">
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
            {session.permissoes.gerarExcel && (
              <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10 font-orbitron text-xs neon-glow-green uppercase font-bold">
                <FileSpreadsheet className="h-3.5 w-3.5" /> EXCEL
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.65rem] text-primary uppercase font-bold">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">FROTA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">POSIÇÃO</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">Nº FOGO</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">LACRE</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase font-bold">DATA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM REGISTRO.</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id} className="border-border/20 table-row-glow">
                  <TableCell className="font-mono-neon text-primary text-sm uppercase">{r.placa}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>
                  <TableCell className="text-[0.65rem] font-orbitron text-[hsl(var(--neon-purple))]">{r.posicao}</TableCell>
                  <TableCell className="text-sm font-orbitron font-bold">{r.num_fogo}</TableCell>
                  <TableCell className="text-sm">{r.lacre}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
