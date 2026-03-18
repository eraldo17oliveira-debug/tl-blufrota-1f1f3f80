import { useState, useEffect } from "react";
import { salvarFornecedor, lerFornecedores, excluirFornecedor, atualizarFornecedor } from "@/lib/storage";
import { Fornecedor, TipoFornecedor } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, FileText, Pencil, Trash2 } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TIPOS: { label: string; value: TipoFornecedor }[] = [
  { label: "COMBUSTÍVEL", value: "COMBUSTÍVEL" },
  { label: "PNEUS / RECAPAGEM", value: "PNEUS / RECAPAGEM" },
  { label: "PEÇAS / MANUTENÇÃO", value: "PEÇAS / MANUTENÇÃO" },
];

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [tipo, setTipo] = useState<TipoFornecedor>("COMBUSTÍVEL");
  const [telefone, setTelefone] = useState("");
  const [cidadeEstado, setCidadeEstado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const load = () => setFornecedores(lerFornecedores());
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setRazaoSocial(""); setCnpjCpf(""); setTipo("COMBUSTÍVEL");
    setTelefone(""); setCidadeEstado(""); setObservacoes("");
    setEditingId(null);
  };

  const openNew = () => { resetForm(); setModalOpen(true); };

  const openEdit = (f: Fornecedor) => {
    setEditingId(f.id);
    setRazaoSocial(f.razaoSocial);
    setCnpjCpf(f.cnpjCpf);
    setTipo(f.tipo);
    setTelefone(f.telefone);
    setCidadeEstado(f.cidadeEstado);
    setObservacoes(f.observacoes);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!razaoSocial) { toast.error("INFORME A RAZÃO SOCIAL!"); return; }
    if (editingId) {
      atualizarFornecedor(editingId, { razaoSocial, cnpjCpf, tipo, telefone, cidadeEstado, observacoes });
      toast.success("FORNECEDOR ATUALIZADO!");
    } else {
      salvarFornecedor({ razaoSocial, cnpjCpf, tipo, telefone, cidadeEstado, observacoes });
      toast.success("FORNECEDOR CADASTRADO!");
    }
    setModalOpen(false);
    resetForm();
    load();
  };

  const handleDelete = (id: string) => {
    excluirFornecedor(id);
    toast.success("FORNECEDOR EXCLUÍDO!");
    load();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("TL-BLU FROTA — FORNECEDORES", 14, 18);
    autoTable(doc, {
      startY: 25,
      head: [["RAZÃO SOCIAL", "CNPJ/CPF", "TIPO", "TELEFONE", "CIDADE/UF", "OBS"]],
      body: fornecedores.map(f => [
        f.razaoSocial, f.cnpjCpf, f.tipo, f.telefone, f.cidadeEstado, f.observacoes,
      ]),
    });
    doc.save("fornecedores_tlblu.pdf");
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">🏢 GESTÃO DE FORNECEDORES</h1>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={openNew} className="gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase flex-1 min-w-[200px]">
          <Plus className="h-5 w-5" /> CADASTRAR NOVO FORNECEDOR
        </Button>
        <Button variant="outline" onClick={handlePDF} className="gap-2 border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-sm h-14 rounded-xl neon-glow-primary uppercase">
          <FileText className="h-5 w-5" /> PDF DE FORNECEDORES
        </Button>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-primary/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary neon-text text-sm uppercase">
              {editingId ? "EDITAR FORNECEDOR" : "NOVO FORNECEDOR"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="NOME DA EMPRESA / RAZÃO SOCIAL" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-xs uppercase" />
            <Input placeholder="CNPJ / CPF" value={cnpjCpf} onChange={e => setCnpjCpf(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 uppercase" />
            <OptionGroup label="TIPO DE FORNECEDOR" value={tipo} onChange={v => setTipo(v as TipoFornecedor)}
              colorClass="bg-[hsl(var(--primary))] text-primary-foreground" glowClass="neon-glow-primary"
              options={TIPOS} />
            <Input placeholder="TELEFONE DE CONTATO" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 uppercase" />
            <Input placeholder="CIDADE / ESTADO" value={cidadeEstado} onChange={e => setCidadeEstado(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 uppercase" />
            <Textarea placeholder="OBSERVAÇÕES" value={observacoes} onChange={e => setObservacoes(e.target.value)}
              className="bg-input border-border/50 focus:border-primary uppercase min-h-[80px]" />
            <Button onClick={handleSave}
              className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase">
              {editingId ? "ATUALIZAR ✅" : "CADASTRAR ✅"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/30 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">FORNECEDORES CADASTRADOS</h2>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">RAZÃO SOCIAL</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">CNPJ/CPF</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TIPO</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">TELEFONE</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">CIDADE/UF</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10 font-orbitron text-xs uppercase">NENHUM FORNECEDOR CADASTRADO.</TableCell></TableRow>
              ) : fornecedores.map(f => (
                <TableRow key={f.id} className="border-border/20">
                  <TableCell className="text-sm font-bold uppercase">{f.razaoSocial}</TableCell>
                  <TableCell className="text-sm font-orbitron">{f.cnpjCpf}</TableCell>
                  <TableCell className="text-[0.65rem] font-orbitron text-[hsl(var(--neon-purple))] uppercase">{f.tipo}</TableCell>
                  <TableCell className="text-sm">{f.telefone}</TableCell>
                  <TableCell className="text-sm uppercase">{f.cidadeEstado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(f)} className="text-primary hover:text-primary/80 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
