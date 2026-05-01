import { supabase } from "@/integrations/supabase/client";
import { UserSession, UserPermissions } from "./types";

export interface RegisteredUser {
  id: string;
  nome: string;
  login: string;
  nivel: string;
  pode_patio: boolean;
  pode_rodizio: boolean;
  pode_combustivel: boolean;
  pode_inventario: boolean;
  pode_fornecedores: boolean;
  pode_expedicao: boolean;
  pode_pdf: boolean;
  pode_excel: boolean;
  ativo: boolean;
}

const SESSION_KEY = "tlblu_session";

export function getPersistedSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch { return null; }
}

export function persistSession(session: UserSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function toPermissoes(u: any): UserPermissions {
  return {
    patio: u.pode_patio,
    rodizio: u.pode_rodizio,
    fornecedores: u.pode_fornecedores,
    expedicao: u.pode_expedicao,
    os: u.pode_patio || u.pode_rodizio,
    lavacao: u.pode_lavacao ?? false,
    bloqueados: u.pode_bloqueados ?? false,
    gerarPdf: u.pode_pdf,
    gerarExcel: u.pode_excel,
  };
}

function nivelToPerfil(nivel: string) {
  const map: Record<string, string> = {
    SUPERVISOR: "SUPERVISOR",
    MANOBRA: "MANOBRA",
    MANUTENCAO: "MANUTENÇÃO",
    EXPEDICAO: "EXPEDIÇÃO",
    LAVACAO: "LAVAÇÃO",
  };
  return map[nivel] || nivel;
}

export function perfilToNivel(perfil: string) {
  const map: Record<string, string> = {
    SUPERVISOR: "SUPERVISOR",
    MANOBRA: "MANOBRA",
    "MANUTENÇÃO": "MANUTENCAO",
    "EXPEDIÇÃO": "EXPEDICAO",
    "LAVAÇÃO": "LAVACAO",
  };
  return map[perfil] || perfil;
}

// Uses secure RPC — never exposes passwords
export async function lerUsuarios(): Promise<RegisteredUser[]> {
  const { data, error } = await supabase.rpc("list_users_safe");
  if (error) { console.error("Erro ao listar usuários"); return []; }
  return (data || []).map((d: any) => ({
    id: d.id,
    nome: d.nome,
    login: d.login,
    nivel: d.nivel,
    pode_patio: d.pode_patio,
    pode_rodizio: d.pode_rodizio,
    pode_combustivel: d.pode_combustivel,
    pode_inventario: d.pode_inventario,
    pode_fornecedores: d.pode_fornecedores,
    pode_expedicao: d.pode_expedicao,
    pode_pdf: d.pode_pdf,
    pode_excel: d.pode_excel,
    ativo: d.ativo,
  }));
}

export async function salvarUsuario(user: Omit<RegisteredUser, "id"> & { senha?: string }) {
  const { error } = await supabase.from("profiles").insert({
    nome: user.nome, login: user.login, senha: user.senha || "",
    nivel: user.nivel, pode_patio: user.pode_patio, pode_rodizio: user.pode_rodizio,
    pode_combustivel: user.pode_combustivel, pode_inventario: user.pode_inventario,
    pode_fornecedores: user.pode_fornecedores, pode_expedicao: user.pode_expedicao,
    pode_lavacao: (user as any).pode_lavacao ?? false,
    pode_bloqueados: (user as any).pode_bloqueados ?? false,
    pode_pdf: user.pode_pdf, pode_excel: user.pode_excel, ativo: user.ativo,
  });
  if (error) console.error("Erro ao salvar usuário");
}

export async function atualizarUsuario(id: string, user: Partial<RegisteredUser> & { senha?: string }) {
  const updateData: any = { ...user };
  delete updateData.id;
  if (!updateData.senha) delete updateData.senha;
  const { error } = await supabase.from("profiles").update(updateData).eq("id", id);
  if (error) console.error("Erro ao atualizar usuário");
}

export async function excluirUsuario(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) console.error("Erro ao excluir usuário");
}

// Secure login via RPC — passwords checked server-side only
export async function verificarLogin(usuario: string, senha: string): Promise<{ sucesso: boolean; session?: UserSession; msg?: string }> {
  const { data, error } = await supabase.rpc("verify_login", {
    p_login: usuario.toUpperCase().trim(),
    p_senha: senha,
  });

  if (error) return { sucesso: false, msg: "ERRO AO CONECTAR!" };
  
  const result = data as any;
  if (!result || !result.sucesso) return { sucesso: false, msg: result?.msg || "ERRO AO FAZER LOGIN" };

  const perfil = nivelToPerfil(result.nivel) as any;
  const session: UserSession = {
    nome: result.nome,
    perfil,
    permissoes: toPermissoes(result),
  };
  
  persistSession(session);
  return { sucesso: true, session };
}
