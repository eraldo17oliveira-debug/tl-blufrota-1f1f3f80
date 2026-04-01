import { useState, useEffect } from "react";
import { salvarRodizio, lerRodizio, todayStr, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, FileText, FileSpreadsheet } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
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

interface PosicaoData {
  numFogo: string;
  lacre: string;
  sulco: string;
  tipo: "ENTRADA" | "SAÍDA";
}

export default function RodizioPage({ session }: { session: UserSession }) {
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [de, setDe] = useState(todayStr());
  const [ate, setAte] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);

  // Inline data per position
  const [posData, setPosData] = useState<Record<string, PosicaoData>>({});
  const [expandedPos, setExpandedPos] = useState<string | null>(null);

  const load = async () => {
    const data = await lerRodizio(de, ate);
    setRecords(data);
  };
  useEffect(() => { load(); }, [de, ate]);

  const updatePosField = (posId: string, field: keyof PosicaoData, value: string) => {
    setPosData(prev => ({
      ...prev,
      [posId]: { ...({ numFogo: "", lacre: "", sulco: "", tipo: "ENTRADA" as const, ...prev[posId] }), [field]: value }
    }));
  };

  const toggleExpand = (posId: string) => {
    if (!placa) { toast.error("INFORME A PLACA PRIMEIRO!"); return; }
    setExpandedPos(prev => prev === posId ? null : posId);
    if (!posData[posId]) {
      setPosData(prev => ({ ...prev, [posId]: { numFogo: "", lacre: "", sulco: "", tipo: "ENTRADA" } }));
    }
  };

  const handleSavePos = async (posId: string) => {
    const d = posData[posId];
    if (!d?.numFogo) { toast.error("INFORME O NÚMERO DE FOGO!"); return; }
    await salvarRodizio({ placa: placa.toUpperCase(), frota: frota.toUpperCase(), posicao: posId, num_fogo: d.numFogo.toUpperCase(), lacre: d.lacre.toUpperCase(), sulco: d.sulco, tipo: d.tipo });
    toast.success(`POSIÇÃO ${posId} REGISTRADA!`);
    setExpandedPos(null);
    setPosData(prev => { const copy = { ...prev }; delete copy[posId]; return copy; });
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — RODÍZIO DE PNEUS — ${de} A ${ate}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["TIPO", "PLACA", "FROTA", "POSIÇÃO", "Nº FOGO", "LACRE", "SULCO (MM)", "DATA"]],
      body: records.map(r => [r.tipo, r.placa, r.frota, r.posicao, r.num_fogo, r.lacre, r.sulco, new Date(r.created_at).toLocaleDateString("pt-BR")]),
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA OPERACIONAL TL-BLU", 14, finalY);
    doc.save(`rodizio_${de}_${ate}.pdf`);
  };

  const handleExcel = () => {
    exportCSV(`rodizio_${de}_${ate}.csv`,
      ["TIPO", "PLACA", "FROTA", "POSIÇÃO", "Nº FOGO", "LACRE", "SULCO (MM)", "DATA"],
      records.map(r => [r.tipo, r.placa, r.frota, r.posicao, r.num_fogo, r.lacre, r.sulco, new Date(r.created_at).toLocaleDateString("pt-BR")])
    );
  };

  const isSulcoCritico = (s: string) => { const v = parseFloat(s); return !isNaN(v) && v < 3.0; };

  const hasRecord = (posId: string) => records.some(r => r.posicao === posId && r.placa === placa.toUpperCase());

  const getPosColor = (posId: string) => {
    if (expandedPos === posId) return "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--neon-cyan)/0.4)]";
    if (hasRecord(posId)) return "bg-accent text-accent-foreground border-transparent neon-glow-green";
    return "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground";
  };

  const renderPosition = (pos: { id: string; label: string }) => {
    const isExpanded = expandedPos === pos.id;
    const d = posData[pos.id] || { numFogo: "", lacre: "", sulco: "", tipo: "ENTRADA" as const };

    return (
      <div key={pos.id} className="space-y-2">
        <button onClick={() => toggleExpand(pos.id)}
          className={`w-full rounded-xl border px-2 py-4 text-[0.6rem] sm:text-[0.7rem] font-bold font-orbitron transition-all duration-300 uppercase active:scale-95 ${getPosColor(pos.id)}`}>
          {pos.label}
          {hasRecord(pos.id) && " ✅"}
        </button>
        {isExpanded && (
          <div className="glass-card rounded-xl p-3 space-y-2 border border-primary/30 animate-in slide-in-from-top-2">
            <div className="flex gap-2">
              <button onClick={() => updatePosField(pos.id, "tipo", "ENTRADA")}
                className={`flex-1 rounded-lg py-2 text-[0.6rem] font-bold font-orbitron uppercase transition-all ${d.tipo === "ENTRADA" ? "bg-accent text-accent-foreground neon-glow-green" : "bg-secondary/50 text-muted-foreground"}`}>
                ENTRADA
              </button>
              <button onClick={() => updatePosField(pos.id, "tipo", "SAÍDA")}
                className={`flex-1 rounded-lg py-2 text-[0.6rem] font-bold font-orbitron uppercase transition-all ${d.tipo === "SAÍDA" ? "bg-destructive text-destructive-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
                SAÍDA
              </button>
            </div>
            <Input placeholder="Nº FOGO" value={d.numFogo} onChange={e => updatePosField(pos.id, "numFogo", e.target.value)}
              className="text-center font-orbitron text-xs bg-input border-border/50 focus:border-primary h-10 uppercase" />
            <Input placeholder="Nº LACRE" value={d.lacre} onChange={e => updatePosField(pos.id, "lacre", e.target.value)}
              className="text-center text-xs bg-input border-border/50 focus:border-primary h-10 uppercase" />
            <Input placeholder="SULCO (MM)" value={d.sulco} onChange={e => updatePosField(pos.id, "sulco", e.target.value)} type="number"
              className="text-center font-orbitron text-xs bg-input border-border/50 focus:border-primary h-10" />
            <Button onClick={() => handleSavePos(pos.id)}
              className="w-full gap-1 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-xs h-10 rounded-lg neon-glow-green uppercase">
              REGISTRAR ✅
            </Button>
          </div>
        )}
      </div>
    );
  };

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
          <PlacaInput value={placa} onChange={(v) => { setPlaca(v); setExpandedPos(null); setPosData({}); }} className="h-14 text-lg" />
          <Input placeholder="NÚMERO DA FROTA" value={frota} onChange={e => setFrota(e.target.value)}
            className="uppercase text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-sm" />
        </div>
      </div>

      {renderAxleGroup("MAPA DO CAVALÃO (3 EIXOS)", CAVALO_EIXOS, "🚛")}
      {renderAxleGroup("MAPA DA CARRETA (3 EIXOS)", CARRETA_EIXOS, "🚚")}

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
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TIPO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] text-primary uppercase">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FROTA</TableHead>
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
                <TableRow key={r.id} className="border-border/20 table-row-glow">
                  <TableCell className={`text-xs font-bold uppercase ${r.tipo === "ENTRADA" ? "text-accent" : "text-destructive"}`}>{r.tipo}</TableCell>
                  <TableCell className="font-mono-neon text-primary text-sm uppercase">{r.placa}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>
                  <TableCell className="text-[0.65rem] font-orbitron text-[hsl(var(--neon-purple))]">{r.posicao}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.num_fogo}</TableCell>
                  <TableCell className="text-sm">{r.lacre}</TableCell>
                  <TableCell className={`text-sm font-orbitron ${isSulcoCritico(r.sulco) ? "sulco-alerta" : ""}`}>{r.sulco}</TableCell>
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
