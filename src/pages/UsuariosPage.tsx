import { useState, useEffect } from "react";
import { lerUsuarios, salvarUsuario, atualizarUsuario, excluirUsuario, RegisteredUser, perfilToNivel } from "@/lib/auth";
import { UserRole, DEFAULT_PERMISSIONS, UserPermissions } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Shield, Ban } from "lucide-react";
import OptionGroup from "@/components/OptionGroup";
import { toast } from "sonner";

const ROLES: UserRole[] = ["SUPERVISOR", "MANOBRA", "MANUTENÇÃO", "EXPEDIÇÃO", "LAVAÇÃO"];

const PERM_LABELS: { key: keyof UserPermissions; dbKey: string; label: string }[] = [
  { key: "patio", dbKey: "pode_patio", label: "ACESSAR PÁTIO" },
  { key: "rodizio", dbKey: "pode_rodizio", label: "ACESSAR PNEUS" },
  { key: "fornecedores", dbKey: "pode_fornecedores", label: "ACESSAR FORNECEDORES" },
  { key: "expedicao", dbKey: "pode_expedicao", label: "CONSULTAR EXPEDIÇÃO" },
  { key: "os", dbKey: "pode_patio", label: "ORDEM DE SERVIÇO" },
  { key: "gerarPdf", dbKey: "pode_pdf", label: "GERAR PDF" },
  { key: "gerarExcel", dbKey: "pode_excel", label: "GERAR EXCEL" },
];

function nivelToPerfil(nivel: string): string {
  const map: Record<string, string> = { SUPERVISOR: "SUPERVISOR", MANOBRA: "MANOBRA", MANUTENCAO: "MANUTENÇÃO", EXPEDICAO: "EXPEDIÇÃO", LAVACAO: "LAVAÇÃO" };
  return map[nivel] || nivel;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<RegisteredUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<UserRole>("MANOBRA");
  const [permissoes, setPermissoes] = useState<UserPermissions>(DEFAULT_PERMISSIONS["MANOBRA"]);

  const load = async () => { const data = await lerUsuarios(); setUsuarios(data); };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setNome(""); setSenha(""); setPerfil("MANOBRA"); setPermissoes(DEFAULT_PERMISSIONS["MANOBRA"]); setEditingId(null); };
  const openNew = () => { resetForm(); setModalOpen(true); };

  const openEdit = (u: RegisteredUser) => {
    setEditingId(u.id); setNome(u.nome); setSenha("");
    setPerfil(nivelToPerfil(u.nivel) as UserRole);
    setPermissoes({
      patio: u.pode_patio, rodizio: u.pode_rodizio,
      fornecedores: u.pode_fornecedores, expedicao: u.pode_expedicao,
      os: u.pode_patio || u.pode_rodizio, lavacao: (u as any).pode_lavacao ?? false,
      gerarPdf: u.pode_pdf, gerarExcel: u.pode_excel,
    });
    setModalOpen(true);
  };

  const handlePerfilChange = (v: string) => { const role = v as UserRole; setPerfil(role); setPermissoes(DEFAULT_PERMISSIONS[role]); };
  const togglePerm = (key: keyof UserPermissions) => { setPermissoes(prev => ({ ...prev, [key]: !prev[key] })); };

  const handleSave = async () => {
    if (!nome) { toast.error("INFORME O NOME!"); return; }
    const nivel = perfilToNivel(perfil);
    const userData: any = {
      nome: nome.toUpperCase(), login: nome.toUpperCase(), nivel,
      pode_patio: permissoes.patio, pode_rodizio: permissoes.rodizio,
      pode_fornecedores: permissoes.fornecedores, pode_expedicao: permissoes.expedicao,
      pode_pdf: permissoes.gerarPdf, pode_excel: permissoes.gerarExcel, ativo: true,
    };
    if (senha) userData.senha = senha;
    if (editingId) { await atualizarUsuario(editingId, userData); toast.success("USUÁRIO ATUALIZADO!"); }
    else { await salvarUsuario(userData); toast.success("USUÁRIO CADASTRADO!"); }
    setModalOpen(false); resetForm(); load();
  };

  const handleDelete = async (id: string) => { await excluirUsuario(id); toast.success("USUÁRIO REMOVIDO!"); load(); };

  const handleToggleAtivo = async (u: RegisteredUser) => {
    await atualizarUsuario(u.id, { ativo: !u.ativo } as any);
    toast.success(u.ativo ? "USUÁRIO BLOQUEADO!" : "USUÁRIO DESBLOQUEADO!");
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text uppercase tracking-wider">👥 GESTÃO MASTER</h1>

      <Button onClick={openNew} className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-primary neon-pulse transition-all duration-300 uppercase w-full">
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
              className="text-center bg-input border-border focus:border-primary h-14 font-orbitron text-xs uppercase" />
            <Input placeholder={editingId ? "NOVA SENHA (DEIXE VAZIO PARA MANTER)" : "SENHA"} value={senha} onChange={e => setSenha(e.target.value)} type="password"
              className="text-center bg-input border-border focus:border-primary h-14" />

            <OptionGroup label="PERFIL" value={perfil} onChange={handlePerfilChange}
              colorClass="bg-primary text-primary-foreground" glowClass="neon-glow-primary"
              options={ROLES.map(r => ({ label: r, value: r }))} />

            <div className="space-y-3">
              <p className="font-orbitron text-[0.65rem] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" /> MATRIZ DE PERMISSÕES
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERM_LABELS.map(p => (
                  <label key={p.key} className="flex items-center gap-3 glass-card rounded-xl p-3 cursor-pointer hover:border-primary/30 transition-all">
                    <Checkbox checked={permissoes[p.key]} onCheckedChange={() => togglePerm(p.key)} />
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
                <TableHead className="font-orbitron text-[0.6rem] uppercase">STATUS</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">PERMISSÕES</TableHead>
                <TableHead className="font-orbitron text-[0.6rem] uppercase">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id} className={`border-border/20 table-row-glow ${!u.ativo ? "opacity-40" : ""}`}>
                  <TableCell className="text-sm font-bold font-orbitron uppercase">{u.nome}</TableCell>
                  <TableCell className="text-xs font-orbitron text-primary">{nivelToPerfil(u.nivel)}</TableCell>
                  <TableCell>
                    <span className={`text-[0.6rem] font-orbitron font-bold uppercase ${u.ativo ? "text-accent" : "text-destructive"}`}>
                      {u.ativo ? "ATIVO" : "BLOQUEADO"}
                    </span>
                  </TableCell>
                  <TableCell className="text-[0.55rem] text-muted-foreground uppercase">
                    {PERM_LABELS.filter(p => p.dbKey && (u as any)[p.dbKey]).map(p => p.label.replace("ACESSAR ", "").replace("CONSULTAR ", "")).join(", ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-primary hover:text-primary/80 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleToggleAtivo(u)} className={`transition-colors ${u.ativo ? "text-warning hover:text-warning/80" : "text-accent hover:text-accent/80"}`} title={u.ativo ? "BLOQUEAR" : "DESBLOQUEAR"}>
                        <Ban className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
