import { useState, useEffect, useCallback } from "react";
import { lerDados, toggleConcluido } from "@/lib/storage";
import { VehicleRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  refreshKey: number;
}

export default function RecordsTable({ refreshKey }: Props) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<VehicleRecord[]>([]);

  const load = useCallback(() => setRecords(lerDados(date)), [date]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleToggle = (id: string) => {
    toggleConcluido(id);
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`FROTA TL-BLU — ${date}`, 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["Placa", "Frota", "Carga", "Local", "Eixo", "Modelo", "Segurança"]],
      body: records.filter(r => !r.concluido).map(r => [r.placa, r.frota, r.estado, r.local, r.eixo, r.modelo, r.status]),
    });
    doc.save(`frota_${date}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Movimentações</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm" />
          <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Frota</TableHead>
              <TableHead>Carga</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Eixo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Segurança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum registro para esta data.
                </TableCell>
              </TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={cn(r.concluido && "opacity-30 line-through")}>
                <TableCell>
                  <button onClick={() => handleToggle(r.id)}
                    className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors",
                      r.concluido ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground text-muted-foreground hover:border-accent hover:text-accent"
                    )}>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="font-semibold">{r.placa}</TableCell>
                <TableCell>{r.frota}</TableCell>
                <TableCell>{r.estado}</TableCell>
                <TableCell>{r.local}</TableCell>
                <TableCell>{r.eixo}</TableCell>
                <TableCell>{r.modelo}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
