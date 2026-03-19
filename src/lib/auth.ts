import { UserSession, RegisteredUser, DEFAULT_PERMISSIONS } from "./types";

const USERS_KEY = "frota_usuarios";

function getRegisteredUsers(): RegisteredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // Seed default users
    const defaults: RegisteredUser[] = [
      { id: "1", nome: "ERALDO", senha: "123", perfil: "SUPERVISOR", permissoes: DEFAULT_PERMISSIONS["SUPERVISOR"], ativo: true },
      { id: "2", nome: "EDUARDO", senha: "", perfil: "MANOBRA", permissoes: DEFAULT_PERMISSIONS["MANOBRA"], ativo: true },
      { id: "3", nome: "ANTONIO", senha: "", perfil: "MANUTENÇÃO", permissoes: DEFAULT_PERMISSIONS["MANUTENÇÃO"], ativo: true },
      { id: "4", nome: "CARLOS", senha: "", perfil: "EXPEDIÇÃO", permissoes: DEFAULT_PERMISSIONS["EXPEDIÇÃO"], ativo: true },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

export function lerUsuarios(): RegisteredUser[] {
  return getRegisteredUsers();
}

export function salvarUsuarios(users: RegisteredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function verificarLogin(usuario: string, senha: string): { sucesso: boolean; session?: UserSession; msg?: string } {
  const users = getRegisteredUsers();
  const u = usuario.toUpperCase().trim();
  const found = users.find(usr => usr.nome === u && usr.ativo);

  if (!found) return { sucesso: false, msg: "USUÁRIO NÃO ENCONTRADO!" };
  if (found.senha && found.senha !== senha) return { sucesso: false, msg: "SENHA INCORRETA!" };

  return {
    sucesso: true,
    session: {
      nome: found.nome,
      perfil: found.perfil,
      permissoes: found.permissoes,
    },
  };
}
