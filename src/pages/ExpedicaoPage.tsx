import { useState, useEffect, useCallback } from "react";
import { lerPatio, todayStr, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileSpreadsheet, Truck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExpedicaoPage({ session }: { session: UserSession }) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);

  const load = useCallback(async () => {
    const data = await lerPatio(date);
    setRecords(data);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  const ativos = records.filter(r => !r.concluido);
  const prontas = ativos.filter(r => r.estado === "Carga");
  const totalPatio = ativos.length;
  const totalCarregadas = prontas.length;
  const totalVazias = ativos.filter(r => r.estado === "Vazia").length;
  const emManutencao = ativos.filter(r => r.status === "Bloqueio").length;

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — EXPEDIÇÃO — ${date}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`TOTAL NO PÁTIO: ${totalPatio} | CARREGADAS: ${totalCarregadas} | VAZIAS: ${totalVazias} | EM MANUTENÇÃO: ${emManutencao}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["FROTA", "PLACA", "STATUS", "LOCALIZAÇÃO", "DATA"]],
      body: prontas.map(r => [r.frota, r.placa, r.estado, r.local, new Date(r.created_at).toLocaleDateString("pt-BR")]),
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA OPERACIONAL TL-BLU", 14, finalY);
    doc.save(`expedicao_${date}.pdf`);
  };

  const handleExcel = () => {
    const summaryRow = [`TOTAL: ${totalPatio}`, `CARREGADAS: ${totalCarregadas}`, `VAZIAS: ${totalVazias}`, `MANUTENÇÃO: ${emManutencao}`, ""];
    exportCSV(`expedicao_${date}.csv`,
      ["FROTA", "PLACA", "STATUS", "LOCALIZAÇÃO", "DATA"],
      [summaryRow, ...prontas.map(r => [r.frota, r.placa, r.estado, r.local, new Date(r.created_at).toLocaleDateString("pt-BR")])]
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-[hsl(var(--neon-purple))] uppercase" style={{ textShadow: "0 0 10px hsl(270 100% 50% / 0.5)" }}>
        📦 EXPEDIÇÃO — CONSULTA DE PÁTIO
      </h1>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "TOTAL PÁTIO", val: totalPatio, cls: "text-primary border-primary/30" },
          { label: "CARREGADAS", val: totalCarregadas, cls: "text-accent border-accent/30" },
          { label: "VAZIAS", val: totalVazias, cls: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))]/30" },
          { label: "MANUTENÇÃO", val: emManutencao, cls: "text-destructive border-destructive/30" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.5rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden" style={{ borderColor: "hsl(270 100% 50% / 0.2)" }}>
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[hsl(var(--neon-purple))]" />
            <h2 className="font-orbitron text-sm font-bold text-[hsl(var(--neon-purple))] uppercase">CARRETAS PRONTAS PARA SAIR</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border/50 font-orbitron text-xs" />
            {session.permissoes.gerarPdf && (
              <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 border-[hsl(var(--neon-purple))]/50 text-[hsl(var(--neon-purple))] hover:bg-[hsl(var(--neon-purple))]/10 font-orbitron text-xs uppercase">
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
                <TableHead className="font-orbitron text-[0.65rem] text-[hsl(var(--neon-purple))] uppercase">PLACA</TableHead>
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
                  <TableCell className="font-mono-neon text-[hsl(var(--neon-purple))] text-sm">{r.placa}</TableCell>
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
