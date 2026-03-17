import { UserSession } from "./types";

export function verificarLogin(usuario: string, senha: string): { sucesso: boolean; session?: UserSession; msg?: string } {
  const u = usuario.toUpperCase().trim();
  if (u === "EDUARDO") return { sucesso: true, session: { nome: "EDUARDO", perfil: "RESTRITO" } };
  if (u === "ERALDO") {
    if (senha === "123") return { sucesso: true, session: { nome: "ERALDO", perfil: "ADMIN" } };
    return { sucesso: false, msg: "Senha incorreta!" };
  }
  return { sucesso: false, msg: "Usuário não encontrado!" };
}
