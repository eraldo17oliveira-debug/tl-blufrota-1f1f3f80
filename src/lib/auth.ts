import { supabase } from "@/integrations/supabase/client";
import { UserSession, UserPermissions } from "./types";

export interface RegisteredUser {
  id: string;
  nome: string;
  login: string;
  senha: string;
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

function toPermissoes(u: RegisteredUser): UserPermissions {
  return {
    patio: u.pode_patio,
    rodizio: u.pode_rodizio,
    combustivel: u.pode_combustivel,
    inventario: u.pode_inventario,
    fornecedores: u.pode_fornecedores,
    expedicao: u.pode_expedicao,
    os: u.pode_patio || u.pode_rodizio, // OS access for patio or rodizio users
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
  };
  return map[nivel] || nivel;
}

export function perfilToNivel(perfil: string) {
  const map: Record<string, string> = {
    SUPERVISOR: "SUPERVISOR",
    MANOBRA: "MANOBRA",
    "MANUTENÇÃO": "MANUTENCAO",
    "EXPEDIÇÃO": "EXPEDICAO",
  };
  return map[perfil] || perfil;
}

export async function lerUsuarios(): Promise<RegisteredUser[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) { console.error(error); return []; }
  return (data || []).map(d => ({
    id: d.id,
    nome: d.nome,
    login: d.login,
    senha: d.senha,
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

export async function salvarUsuario(user: Omit<RegisteredUser, "id">) {
  const { error } = await supabase.from("profiles").insert({
    nome: user.nome,
    login: user.login,
    senha: user.senha,
    nivel: user.nivel,
    pode_patio: user.pode_patio,
    pode_rodizio: user.pode_rodizio,
    pode_combustivel: user.pode_combustivel,
    pode_inventario: user.pode_inventario,
    pode_fornecedores: user.pode_fornecedores,
    pode_expedicao: user.pode_expedicao,
    pode_pdf: user.pode_pdf,
    pode_excel: user.pode_excel,
    ativo: user.ativo,
  });
  if (error) console.error(error);
}

export async function atualizarUsuario(id: string, user: Partial<RegisteredUser>) {
  const { error } = await supabase.from("profiles").update({
    nome: user.nome,
    login: user.login,
    senha: user.senha,
    nivel: user.nivel,
    pode_patio: user.pode_patio,
    pode_rodizio: user.pode_rodizio,
    pode_combustivel: user.pode_combustivel,
    pode_inventario: user.pode_inventario,
    pode_fornecedores: user.pode_fornecedores,
    pode_expedicao: user.pode_expedicao,
    pode_pdf: user.pode_pdf,
    pode_excel: user.pode_excel,
    ativo: user.ativo,
  }).eq("id", id);
  if (error) console.error(error);
}

export async function excluirUsuario(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) console.error(error);
}

export async function verificarLogin(usuario: string, senha: string): Promise<{ sucesso: boolean; session?: UserSession; msg?: string }> {
  const u = usuario.toUpperCase().trim();
  const { data, error } = await supabase.from("profiles").select("*").eq("login", u).eq("ativo", true).maybeSingle();

  if (error) return { sucesso: false, msg: "ERRO AO CONECTAR!" };
  if (!data) return { sucesso: false, msg: "USUÁRIO NÃO ENCONTRADO!" };
  if (data.senha && data.senha !== senha) return { sucesso: false, msg: "SENHA INCORRETA!" };

  const perfil = nivelToPerfil(data.nivel) as any;
  return {
    sucesso: true,
    session: {
      nome: data.nome,
      perfil,
      permissoes: toPermissoes(data as any),
    },
  };
}
