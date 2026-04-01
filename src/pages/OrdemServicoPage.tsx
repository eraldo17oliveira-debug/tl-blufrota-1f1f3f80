import { useState, useEffect } from "react";
import { salvarOS, lerOS, atualizarStatusOS, exportCSV } from "@/lib/storage";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Plus, FileText, FileSpreadsheet } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import PlacaInput from "@/components/PlacaInput";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type OSStatus = "AGUARDANDO PEÇA" | "EM EXECUÇÃO" | "CONCLUÍDO";

const TIPOS_SERVICO = [
  "TROCA DE PNEU", "ALINHAMENTO", "BALANCEAMENTO", "TROCA DE ÓLEO",
  "FREIO", "SUSPENSÃO", "ELÉTRICA", "FUNILARIA", "PINTURA",
  "MOTOR", "CÂMBIO", "EMBREAGEM", "AR CONDICIONADO", "SOLDA",
  "LUBRIFICAÇÃO", "REVISÃO GERAL", "OUTROS"
];

export default function OrdemServicoPage({ session }: { session: UserSession }) {
  const [frota, setFrota] = useState("");
  const [placa, setPlaca] = useState("");
  const [tiposServico, setTiposServico] = useState<string[]>([]);
  const [localServico, setLocalServico] = useState("");
  const [itemPeca, setItemPeca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [mecanico, setMecanico] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<OSStatus>("AGUARDANDO PEÇA");
  const [records, setRecords] = useState<any[]>([]);

  const load = async () => { const data = await lerOS(); setRecords(data); };
  useEffect(() => { load(); }, []);

  const toggleTipoServico = (tipo: string) => {
    setTiposServico(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
  };

  const handleSave = async () => {
    if (!frota || !placa) { toast.error("INFORME FROTA E PLACA!"); return; }
    if (tiposServico.length === 0) { toast.error("SELECIONE O TIPO DE SERVIÇO!"); return; }
    await salvarOS({
      frota: frota.toUpperCase(), placa: placa.toUpperCase(),
      item_peca: itemPeca.toUpperCase(), quantidade: parseInt(quantidade) || 1,
      mecanico: mecanico.toUpperCase(), descricao: descricao.toUpperCase(),
      status, tipo_servico: tiposServico.join(", "), local_servico: localServico.toUpperCase()
    });
    toast.success("OS REGISTRADA!");
    setFrota(""); setPlaca(""); setItemPeca(""); setQuantidade("1"); setMecanico(""); setDescricao(""); setTiposServico([]); setLocalServico("");
    load();
  };

  const handleStatusChange = async (id: string, newStatus: OSStatus) => {
    await atualizarStatusOS(id, newStatus);
    load();
  };

  const statusColor = (s: string) => {
    if (s === "AGUARDANDO PEÇA") return "text-warning font-bold";
    if (s === "EM EXECUÇÃO") return "text-info font-bold";
    return "text-accent font-bold";
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("TL-BLU FROTA — ORDENS DE SERVIÇO", 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["OS Nº", "FROTA", "PLACA", "TIPO SERVIÇO", "LOCAL", "MECÂNICO", "STATUS", "DATA"]],
      body: records.map(r => [
        `OS-${String(r.numero_os || "").padStart(4, "0")}`, r.frota, r.placa,
        r.tipo_servico || r.item_peca, r.local_servico || "", r.mecanico,
        r.status, new Date(r.created_at).toLocaleDateString("pt-BR")
      ]),
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA OPERACIONAL TL-BLU", 14, finalY);
    doc.save("ordens_servico_tlblu.pdf");
  };

  const handleExcel = () => {
    exportCSV("ordens_servico_tlblu.csv",
      ["OS Nº", "FROTA", "PLACA", "TIPO SERVIÇO", "LOCAL", "ITEM/PEÇA", "QTD", "MECÂNICO", "DESCRIÇÃO", "STATUS", "DATA"],
      records.map(r => [
        `OS-${String(r.numero_os || "").padStart(4, "0")}`, r.frota, r.placa,
        r.tipo_servico || "", r.local_servico || "", r.item_peca, String(r.quantidade),
        r.mecanico, r.descricao, r.status, new Date(r.created_at).toLocaleDateString("pt-BR")
      ])
    );
  };

  const contagem = {
    aguardando: records.filter(r => r.status === "AGUARDANDO PEÇA").length,
    execucao: records.filter(r => r.status === "EM EXECUÇÃO").length,
    concluido: records.filter(r => r.status === "CONCLUÍDO").length,
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">🔧 ORDEM DE SERVIÇO INTERNA</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "AGUARDANDO PEÇA", val: contagem.aguardando, cls: "text-warning border-warning/30" },
          { label: "EM EXECUÇÃO", val: contagem.execucao, cls: "text-info border-info/30" },
          { label: "CONCLUÍDO", val: contagem.concluido, cls: "text-accent border-accent/30" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-4 text-center border ${c.cls}`}>
            <p className="text-2xl font-bold font-orbitron">{c.val}</p>
            <p className="text-[0.55rem] font-orbitron uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="FROTA" value={frota} onChange={e => setFrota(e.target.value)} className="text-center uppercase font-orbitron text-sm bg-input border-border/50 focus:border-primary h-12" />
          <PlacaInput value={placa} onChange={setPlaca} />
        </div>

        <div className="space-y-2">
          <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest">TIPO DE SERVIÇO (SELECIONE UM OU MAIS)</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_SERVICO.map(tipo => (
              <button key={tipo} onClick={() => toggleTipoServico(tipo)}
                className={`rounded-lg px-3 py-2 text-[0.6rem] font-bold font-orbitron uppercase transition-all duration-200 border ${
                  tiposServico.includes(tipo)
                    ? "bg-primary text-primary-foreground border-primary neon-glow-primary"
                    : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-primary/50"
                }`}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input placeholder="LOCAL DO SERVIÇO" value={localServico} onChange={e => setLocalServico(e.target.value)} className="text-center uppercase bg-input border-border/50 focus:border-primary h-12" />
          <Input placeholder="ITEM / PEÇA" value={itemPeca} onChange={e => setItemPeca(e.target.value)} className="text-center uppercase bg-input border-border/50 focus:border-primary h-12" />
          <Input placeholder="QUANTIDADE" type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} className="text-center font-orbitron text-sm bg-input border-border/50 h-12" />
          <Input placeholder="MECÂNICO RESPONSÁVEL" value={mecanico} onChange={e => setMecanico(e.target.value)} className="text-center uppercase bg-input border-border/50 focus:border-primary h-12 col-span-2 sm:col-span-3" />
        </div>

        <Textarea placeholder="DESCRIÇÃO DO SERVIÇO" value={descricao} onChange={e => setDescricao(e.target.value)} className="bg-input border-border/50 focus:border-primary uppercase min-h-[80px]" />

        <OptionGroup label="STATUS" value={status} onChange={v => setStatus(v as OSStatus)}
          colorClass="bg-primary text-primary-foreground" glowClass="neon-glow-primary"
          options={[
            { label: "AGUARDANDO PEÇA", value: "AGUARDANDO PEÇA" },
            { label: "EM EXECUÇÃO", value: "EM EXECUÇÃO" },
            { label: "CONCLUÍDO", value: "CONCLUÍDO" },
          ]} />

        <Button onClick={handleSave} className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase">
          <Plus className="h-5 w-5" /> REGISTRAR OS ✅
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">ORDENS DE SERVIÇO</h2>
          </div>
          <div className="flex gap-2">
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
                <TableHead className="font-orbitron text-[0.6rem] uppercase">OS Nº</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">FROTA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">PLACA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TIPO SERVIÇO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">LOCAL</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">MECÂNICO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">STATUS</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">DATA</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">AÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUMA OS REGISTRADA.</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id} className="border-border/20 table-row-glow">
                  <TableCell className="text-sm font-orbitron text-primary font-bold">OS-{String(r.numero_os || "").padStart(4, "0")}</TableCell>
                  <TableCell className="text-sm font-orbitron">{r.frota}</TableCell>
                  <TableCell className="font-mono-neon text-primary text-sm">{r.placa}</TableCell>
                  <TableCell className="text-xs uppercase max-w-[150px] truncate">{r.tipo_servico || r.item_peca}</TableCell>
                  <TableCell className="text-xs uppercase">{r.local_servico || "-"}</TableCell>
                  <TableCell className="text-sm uppercase">{r.mecanico}</TableCell>
                  <TableCell className={`text-xs uppercase ${statusColor(r.status)}`}>{r.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value as OSStatus)}
                      className="bg-input border border-border/50 rounded-lg text-xs p-1.5 text-foreground uppercase">
                      <option value="AGUARDANDO PEÇA">AGUARDANDO PEÇA</option>
                      <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                      <option value="CONCLUÍDO">CONCLUÍDO</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
