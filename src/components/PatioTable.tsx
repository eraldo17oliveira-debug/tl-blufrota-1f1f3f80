import { useState, useEffect, useCallback } from "react";
import { lerPatio, atualizarPatio, todayStr, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileSpreadsheet, Monitor, Pencil, Save, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props { refreshKey: number; session: UserSession; }

export default function PatioTable({ refreshKey, session }: Props) {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const load = useCallback(async () => {
    const data = await lerPatio(date);
    setRecords(data);
  }, [date]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const ativos = records.filter(r => !r.concluido);
  const totalPatio = ativos.length;
  // Vazia + Bloqueio NÃO conta como vazia
  const totalCarregadas = ativos.filter(r => r.estado === "Carga").length;
  const totalVazias = ativos.filter(r => r.estado === "Vazia" && r.status !== "Bloqueio").length;
  const emManutencao = ativos.filter(r => r.status === "Bloqueio").length;

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditData({ estado: r.estado, local: r.local, status: r.status, motivo_bloqueio: r.motivo_bloqueio || "" });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id: string) => {
    if (editData.status === "Bloqueio" && !editData.motivo_bloqueio?.trim()) {
      toast.error("INFORME O MOTIVO DO BLOQUEIO!");
      return;
    }
    await atualizarPatio(id, {
      estado: editData.estado,
      local: editData.local,
      status: editData.status,
      motivo_bloqueio: editData.status === "Bloqueio" ? editData.motivo_bloqueio : "",
    });
    toast.success("REGISTRO ATUALIZADO!");
    setEditingId(null);
    setEditData({});
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" }); doc.setFontSize(14);
    doc.text(`TL-BLU FROTA — PÁTIO — ${date}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`TOTAL NO PÁTIO: ${totalPatio} | CARREGADAS: ${totalCarregadas} | VAZIAS: ${totalVazias} | EM MANUTENÇÃO: ${emManutencao}`, 14, 26);
    autoTable(doc, { startY: 32, head: [["FROTA", "PLACA", "CARGA", "LOCAL", "SEGURANÇA", "MOTIVO", "EIXO", "MODELO", "DATA"]],
      body: ativos.map(r => [r.frota, r.placa, r.estado, r.local, r.status, r.motivo_bloqueio || "", r.eixo, r.modelo, new Date(r.created_at).toLocaleDateString("pt-BR")]) });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA OPERACIONAL TL-BLU", 14, finalY);
    doc.save(`patio_${date}.pdf`);
  };

  const handleExcel = () => {
    const summaryRow = [`TOTAL: ${totalPatio}`, `CARREGADAS: ${totalCarregadas}`, `VAZIAS: ${totalVazias}`, `MANUTENÇÃO: ${emManutencao}`, "", "", "", "", ""];
    exportCSV(`patio_${date}.csv`, ["FROTA", "PLACA", "CARGA", "LOCAL", "SEGURANÇA", "MOTIVO", "EIXO", "MODELO", "DATA"],
      [summaryRow, ...ativos.map(r => [r.frota, r.placa, r.estado, r.local, r.status, r.motivo_bloqueio || "", r.eixo, r.modelo, new Date(r.created_at).toLocaleDateString("pt-BR")])]);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap p-5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">MONITORAMENTO</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-sm bg-input border-border font-orbitron text-xs" />
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

      <div className="grid grid-cols-4 gap-2 p-4">
        {[
          { label: "TOTAL PÁTIO", val: totalPatio, cls: "text-primary" },
          { label: "CARREGADAS", val: totalCarregadas, cls: "text-accent" },
          { label: "VAZIAS", val: totalVazias, cls: "text-[hsl(var(--neon-orange))]" },
          { label: "MANUTENÇÃO", val: emManutencao, cls: "text-destructive" },
        ].map(c => (
          <div key={c.label} className="text-center glass-card rounded-xl p-3">
            <p className={`text-xl font-bold font-orbitron ${c.cls}`}>{c.val}</p>
            <p className="text-[0.5rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="font-orbitron text-[0.65rem] text-primary uppercase">PLACA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">FROTA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">CARGA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">LOCAL</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">SEGURANÇA</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">EIXO</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase">MODELO</TableHead>
              <TableHead className="font-orbitron text-[0.65rem] uppercase w-16">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM REGISTRO PARA ESTA DATA.</TableCell></TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={cn("border-border/20 transition-all duration-300 table-row-glow", r.status === "Bloqueio" && "bg-destructive/10")}>
                <TableCell className="font-mono-neon text-primary text-sm">{r.placa}</TableCell>
                <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>

                {editingId === r.id ? (
                  <>
                    <TableCell>
                      <select value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value })}
                        className="bg-input border border-border rounded px-2 py-1 text-xs font-orbitron uppercase">
                        <option value="Vazia">VAZIA</option>
                        <option value="Carga">CARGA</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <select value={editData.local} onChange={e => setEditData({ ...editData, local: e.target.value })}
                        className="bg-input border border-border rounded px-2 py-1 text-xs font-orbitron uppercase">
                        <option value="Pátio">PÁTIO</option>
                        <option value="Doca">DOCA</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <select value={editData.status} onChange={e => { setEditData({ ...editData, status: e.target.value, motivo_bloqueio: e.target.value !== "Bloqueio" ? "" : editData.motivo_bloqueio }); }}
                          className="bg-input border border-border rounded px-2 py-1 text-xs font-orbitron uppercase w-full">
                          <option value="Livre">LIVRE</option>
                          <option value="Bloqueio">BLOQUEIO</option>
                        </select>
                        {editData.status === "Bloqueio" && (
                          <Textarea value={editData.motivo_bloqueio} onChange={e => setEditData({ ...editData, motivo_bloqueio: e.target.value })}
                            placeholder="MOTIVO..." className="text-xs uppercase min-h-[40px] bg-input border-destructive/50" />
                        )}
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-sm uppercase">{r.estado}</TableCell>
                    <TableCell className="text-sm uppercase">{r.local}</TableCell>
                    <TableCell className="text-sm uppercase">
                      <div className="flex items-center gap-1">
                        {r.status === "Bloqueio" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                        <span className={cn(r.status === "Bloqueio" && "text-destructive font-bold")}>{r.status}</span>
                      </div>
                      {r.status === "Bloqueio" && r.motivo_bloqueio && (
                        <p className="text-[0.6rem] text-destructive/80 mt-0.5">{r.motivo_bloqueio}</p>
                      )}
                    </TableCell>
                  </>
                )}

                <TableCell className="text-sm">{r.eixo}</TableCell>
                <TableCell className="text-sm">{r.modelo}</TableCell>
                <TableCell>
                  {editingId === r.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(r.id)} className="h-7 w-7 rounded-full bg-accent/20 text-accent hover:bg-accent/40 flex items-center justify-center">
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="h-7 w-7 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40 flex items-center justify-center">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(r)} className="h-7 w-7 rounded-full bg-primary/20 text-primary hover:bg-primary/40 flex items-center justify-center">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
