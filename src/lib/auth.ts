import { UserSession } from "./types";

export function verificarLogin(usuario: string, senha: string): { sucesso: boolean; session?: UserSession; msg?: string } {
  const u = usuario.toUpperCase().trim();

  if (u === "ERALDO") {
    if (senha === "123") return { sucesso: true, session: { nome: "ERALDO", perfil: "SUPERVISOR" } };
    return { sucesso: false, msg: "Senha incorreta!" };
  }
  if (u === "EDUARDO") return { sucesso: true, session: { nome: "EDUARDO", perfil: "MANOBRA" } };
  if (u === "MARCOS") return { sucesso: true, session: { nome: "MARCOS", perfil: "MANUTENÇÃO" } };

  return { sucesso: false, msg: "Usuário não encontrado!" };
}
