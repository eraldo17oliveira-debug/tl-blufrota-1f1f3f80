import { useState, useEffect } from "react";
import { lerUsuarios, salvarUsuarios } from "@/lib/auth";
import { RegisteredUser, UserRole, DEFAULT_PERMISSIONS, UserPermissions } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Shield } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";

const ROLES: UserRole[] = ["SUPERVISOR", "MANOBRA", "MANUTENÇÃO", "EXPEDIÇÃO"];

const PERM_LABELS: { key: keyof UserPermissions; label: string }[] = [
  { key: "patio", label: "ACESSAR PÁTIO" },
  { key: "rodizio", label: "ACESSAR PNEUS" },
  { key: "combustivel", label: "ACESSAR DIESEL" },
  { key: "inventario", label: "ACESSAR ESTOQUE" },
  { key: "fornecedores", label: "ACESSAR FORNECEDORES" },
  { key: "expedicao", label: "CONSULTAR EXPEDIÇÃO" },
  { key: "gerarPdf", label: "GERAR PDF" },
  { key: "gerarExcel", label: "GERAR EXCEL" },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<RegisteredUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<UserRole>("MANOBRA");
  const [permissoes, setPermissoes] = useState<UserPermissions>(DEFAULT_PERMISSIONS["MANOBRA"]);

  const load = () => setUsuarios(lerUsuarios());
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setNome(""); setSenha(""); setPerfil("MANOBRA");
    setPermissoes(DEFAULT_PERMISSIONS["MANOBRA"]); setEditingId(null);
  };

  const openNew = () => { resetForm(); setModalOpen(true); };

  const openEdit = (u: RegisteredUser) => {
    setEditingId(u.id); setNome(u.nome); setSenha(u.senha);
    setPerfil(u.perfil); setPermissoes(u.permissoes); setModalOpen(true);
  };

  const handlePerfilChange = (v: string) => {
    const role = v as UserRole;
    setPerfil(role);
    setPermissoes(DEFAULT_PERMISSIONS[role]);
  };

  const togglePerm = (key: keyof UserPermissions) => {
    setPermissoes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!nome) { toast.error("INFORME O NOME!"); return; }
    const all = lerUsuarios();
    if (editingId) {
      const idx = all.findIndex(u => u.id === editingId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], nome: nome.toUpperCase(), senha, perfil, permissoes };
      }
      toast.success("USUÁRIO ATUALIZADO!");
    } else {
      all.push({
        id: crypto.randomUUID(), nome: nome.toUpperCase(), senha,
        perfil, permissoes, ativo: true,
      });
      toast.success("USUÁRIO CADASTRADO!");
    }
    salvarUsuarios(all);
    setModalOpen(false); resetForm(); load();
  };

  const handleDelete = (id: string) => {
    const all = lerUsuarios().filter(u => u.id !== id);
    salvarUsuarios(all);
    toast.success("USUÁRIO REMOVIDO!");
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase">👥 GESTÃO DE USUÁRIOS</h1>

      <Button onClick={openNew} className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-primary transition-all duration-300 uppercase w-full">
        <Plus className="h-5 w-5" /> CADASTRAR NOVO USUÁRIO
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-primary/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary neon-text text-sm uppercase">
              {editingId ? "EDITAR USUÁRIO" : "NOVO USUÁRIO"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="NOME DO USUÁRIO" value={nome} onChange={e => setNome(e.target.value)}
              className="text-center bg-input border-border/50 focus:border-primary h-14 font-orbitron text-xs uppercase" />
            <Input placeholder="SENHA (OPCIONAL)" value={senha} onChange={e => setSenha(e.target.value)} type="password"
              className="text-center bg-input border-border/50 focus:border-primary h-14" />

            <OptionGroup label="PERFIL" value={perfil} onChange={handlePerfilChange}
              colorClass="bg-primary text-primary-foreground" glowClass="neon-glow-primary"
              options={ROLES.map(r => ({ label: r, value: r }))} />

            <div className="space-y-3">
              <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> MATRIZ DE PERMISSÕES
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERM_LABELS.map(p => (
                  <label key={p.key} className="flex items-center gap-3 glass-card rounded-xl p-3 cursor-pointer hover:border-primary/30 transition-all">
                    <Checkbox
                      checked={permissoes[p.key]}
                      onCheckedChange={() => togglePerm(p.key)}
                    />
                    <span className="font-orbitron text-[0.6rem] uppercase">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave}
              className="w-full gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300 uppercase">
              {editingId ? "ATUALIZAR ✅" : "CADASTRAR ✅"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/30 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-orbitron text-sm font-bold text-primary neon-text uppercase">USUÁRIOS CADASTRADOS</h2>
        </div>
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-orbitron text-[0.6rem] uppercase">NOME</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">PERFIL</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">PERMISSÕES</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id} className="border-border/20">
                  <TableCell className="text-sm font-bold font-orbitron uppercase">{u.nome}</TableCell>
                  <TableCell className="text-xs font-orbitron text-primary">{u.perfil}</TableCell>
                  <TableCell className="text-[0.55rem] text-muted-foreground uppercase">
                    {PERM_LABELS.filter(p => u.permissoes[p.key]).map(p => p.label.replace("ACESSAR ", "").replace("CONSULTAR ", "")).join(", ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-primary hover:text-primary/80"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(u.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
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
