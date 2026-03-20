import { useState, useEffect, useCallback } from "react";
import { lerPatio, toggleConcluidoPatio, todayStr, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, FileSpreadsheet, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props { refreshKey: number; session: UserSession; }

export default function PatioTable({ refreshKey, session }: Props) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);

  const load = useCallback(async () => {
    const data = await lerPatio(date);
    setRecords(data);
  }, [date]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const handleToggle = async (id: string) => { await toggleConcluidoPatio(id); load(); };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" }); doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — PÁTIO — ${date}`, 14, 18);
    autoTable(doc, { startY: 25, head: [["PLACA", "FROTA", "CARGA", "LOCAL", "EIXO", "MODELO", "SEGURANÇA"]],
      body: records.filter(r => !r.concluido).map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status]) });
    doc.save(`patio_${date}.pdf`);
  };

  const handleExcel = () => {
    exportCSV(`patio_${date}.csv`, ["PLACA", "FROTA", "CARGA", "LOCAL", "EIXO", "MODELO", "SEGURANÇA"],
      records.filter(r => !r.concluido).map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status]));
  };

  const canCheck = (r: any) => {
    if (session.perfil === "SUPERVISOR") return true;
    return r.estado === "Carga" && r.local === "Pátio";
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">MONITORAMENTO</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border/50 font-orbitron text-xs" />
          {session.permissoes.gerarPdf && (
            <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-orbitron text-xs neon-glow-primary uppercase">
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
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="w-12 font-orbitron text-[0.65rem] uppercase">CHECK</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] text-primary uppercase">PLACA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">FROTA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">CARGA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">LOCAL</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">EIXO</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">MODELO</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">SEGURANÇA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM REGISTRO PARA ESTA DATA.</TableCell></TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={cn("border-border/20 transition-all duration-300", r.concluido && "opacity-20 line-through")}>
                <TableCell>
                  {canCheck(r) ? (
                    <button onClick={() => handleToggle(r.id)}
                      className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        r.concluido ? "border-accent bg-accent text-accent-foreground neon-glow-green" : "border-accent/50 text-accent/50 hover:border-accent hover:text-accent hover:neon-glow-green")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : <div className="h-8 w-8" />}
                </TableCell>
                <TableCell className="font-mono-neon text-primary text-sm">{r.placa}</TableCell>
                <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>
                <TableCell className="text-sm uppercase">{r.estado}</TableCell>
                <TableCell className="text-sm uppercase">{r.local}</TableCell>
                <TableCell className="text-sm">{r.eixo}</TableCell>
                <TableCell className="text-sm">{r.modelo}</TableCell>
                <TableCell className="text-sm uppercase">{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
