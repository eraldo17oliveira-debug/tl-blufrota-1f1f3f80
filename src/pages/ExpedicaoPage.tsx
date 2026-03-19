import { useState, useEffect, useCallback } from "react";
import { lerPatio, todayStr, exportCSV } from "@/lib/storage";
import { PatioRecord, UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileSpreadsheet, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExpedicaoPage({ session }: { session: UserSession }) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<PatioRecord[]>([]);

  const load = useCallback(() => setRecords(lerPatio(date)), [date]);
  useEffect(() => { load(); }, [load]);

  const prontas = records.filter(r => r.estado === "Carga" && !r.concluido);

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — EXPEDIÇÃO — ${date}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["PLACA", "FROTA", "CARGA", "LOCAL", "EIXO", "MODELO", "SEGURANÇA"]],
      body: prontas.map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status]),
    });
    doc.save(`expedicao_${date}.pdf`);
  };

  const handleExcel = () => {
    exportCSV(`expedicao_${date}.csv`,
      ["PLACA", "FROTA", "CARGA", "LOCAL", "EIXO", "MODELO", "SEGURANÇA"],
      prontas.map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status])
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-neon-purple uppercase" style={{ textShadow: "0 0 10px hsl(280 100% 53% / 0.6), 0 0 30px hsl(280 100% 53% / 0.3)" }}>
        📦 EXPEDIÇÃO — CONSULTA DE PÁTIO
      </h1>

      <div className="glass-card rounded-2xl overflow-hidden" style={{ borderColor: "hsl(280 100% 53% / 0.2)" }}>
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-neon-purple" />
            <h2 className="font-orbitron text-sm font-bold text-neon-purple uppercase">CARRETAS PRONTAS PARA SAIR</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border/50 font-orbitron text-xs" />
            {session.permissoes.gerarPdf && (
              <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10 font-orbitron text-xs uppercase" style={{ boxShadow: "0 0 8px hsl(280 100% 53% / 0.3)" }}>
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
            {session.permissoes.gerarExcel && (
              <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10 font-orbitron text-xs uppercase neon-glow-green">
                <FileSpreadsheet className="h-3.5 w-3.5" /> EXCEL
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-orbitron text-[0.65rem] text-neon-purple uppercase">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">FROTA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">CARGA</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">LOCAL</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">EIXO</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">MODELO</TableHead>
                <TableHead className="font-orbitron text-[0.65rem] uppercase">SEGURANÇA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prontas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">
                    NENHUMA CARRETA PRONTA PARA EXPEDIÇÃO.
                  </TableCell>
                </TableRow>
              ) : prontas.map(r => (
                <TableRow key={r.id} className="border-border/20">
                  <TableCell className="font-mono-neon text-neon-purple text-sm">{r.placa}</TableCell>
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
    </div>
  );
}
