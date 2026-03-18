import { useState, useEffect, useCallback } from "react";
import { lerPatio, toggleConcluidoPatio, todayStr } from "@/lib/storage";
import { PatioRecord, UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  refreshKey: number;
  session: UserSession;
}

export default function PatioTable({ refreshKey, session }: Props) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<PatioRecord[]>([]);

  const load = useCallback(() => setRecords(lerPatio(date)), [date]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const handleToggle = (id: string) => { toggleConcluidoPatio(id); load(); };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — Pátio — ${date}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["Placa", "Frota", "Carga", "Local", "Eixo", "Modelo", "Segurança"]],
      body: records.filter(r => !r.concluido).map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status]),
    });
    doc.save(`patio_${date}.pdf`);
  };

  const canCheck = (r: PatioRecord) => {
    if (session.perfil === "SUPERVISOR") return true;
    return r.estado === "Carga" && r.local === "Pátio";
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text">MONITORAMENTO</h2>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border/50 font-orbitron text-xs" />
          <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-orbitron text-xs neon-glow-primary">
            <FileText className="h-3.5 w-3.5" /> PDF 📃
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="w-12 font-orbitron text-[0.65rem]">Check</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] text-primary">Placa</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Frota</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Carga</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Local</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Eixo</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Modelo</TableHead>
              <TableHead className="font-orbitron text-[0.65rem]">Segurança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs">
                  Nenhum registro para esta data.
                </TableCell>
              </TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={cn("border-border/20 transition-all duration-300", r.concluido && "opacity-20 line-through")}>
                <TableCell>
                  {canCheck(r) ? (
                    <button onClick={() => handleToggle(r.id)}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        r.concluido
                          ? "border-accent bg-accent text-accent-foreground neon-glow-green"
                          : "border-accent/50 text-accent/50 hover:border-accent hover:text-accent hover:neon-glow-green"
                      )}>
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : <div className="h-8 w-8" />}
                </TableCell>
                <TableCell className="font-mono-neon text-primary text-sm">{r.placa}</TableCell>
                <TableCell className="text-sm">{r.frota}</TableCell>
                <TableCell className="text-sm">{r.estado}</TableCell>
                <TableCell className="text-sm">{r.local}</TableCell>
                <TableCell className="text-sm">{r.eixo}</TableCell>
                <TableCell className="text-sm">{r.modelo}</TableCell>
                <TableCell className="text-sm">{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
