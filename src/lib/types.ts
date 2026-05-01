export type UserRole = "SUPERVISOR" | "MANOBRA" | "MANUTENÇÃO" | "EXPEDIÇÃO" | "LAVAÇÃO";

export interface UserPermissions {
  patio: boolean;
  rodizio: boolean;
  fornecedores: boolean;
  expedicao: boolean;
  os: boolean;
  lavacao: boolean;
  bloqueados: boolean;
  gerarPdf: boolean;
  gerarExcel: boolean;
}

export interface UserSession {
  nome: string;
  perfil: UserRole;
  permissoes: UserPermissions;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  SUPERVISOR: {
    patio: true, rodizio: true, fornecedores: true, expedicao: true, os: true, lavacao: true, bloqueados: true, gerarPdf: true, gerarExcel: true,
  },
  MANOBRA: {
    patio: true, rodizio: false, fornecedores: false, expedicao: false, os: false, lavacao: false, bloqueados: false, gerarPdf: true, gerarExcel: false,
  },
  "MANUTENÇÃO": {
    patio: false, rodizio: true, fornecedores: false, expedicao: false, os: true, lavacao: false, bloqueados: false, gerarPdf: true, gerarExcel: false,
  },
  "EXPEDIÇÃO": {
    patio: false, rodizio: false, fornecedores: false, expedicao: true, os: false, lavacao: false, bloqueados: true, gerarPdf: true, gerarExcel: true,
  },
  "LAVAÇÃO": {
    patio: false, rodizio: false, fornecedores: false, expedicao: false, os: false, lavacao: true, bloqueados: false, gerarPdf: false, gerarExcel: false,
  },
};

export function getModuleAccess(permissoes: UserPermissions): string[] {
  const modules: string[] = [];
  if (permissoes.patio) modules.push("patio");
  if (permissoes.rodizio) modules.push("rodizio");
  if (permissoes.fornecedores) modules.push("fornecedores");
  if (permissoes.expedicao) modules.push("expedicao");
  if (permissoes.os) modules.push("os");
  if (permissoes.lavacao) modules.push("lavacao");
  if (permissoes.bloqueados) modules.push("bloqueados");
  return modules;
}

export interface PatioRecord {
  id: string;
  timestamp: Date;
  placa: string;
  frota: string;
  estado: string;
  local: string;
  eixo: string;
  modelo: string;
  status: string;
  concluido: boolean;
}

export interface RodizioRecord {
  id: string;
  timestamp: Date;
  placa: string;
  frota: string;
  posicao: string;
  numFogo: string;
  lacre: string;
  sulco: string;
  tipo: "ENTRADA" | "SAÍDA";
}

export type TipoFornecedor = "COMBUSTÍVEL" | "PNEUS / RECAPAGEM" | "PEÇAS / MANUTENÇÃO";

export interface Fornecedor {
  id: string;
  timestamp: Date;
  razaoSocial: string;
  cnpjCpf: string;
  tipo: TipoFornecedor;
  telefone: string;
  cidadeEstado: string;
  observacoes: string;
}

export interface RegisteredUser {
  id: string;
  nome: string;
  senha: string;
  perfil: UserRole;
  permissoes: UserPermissions;
  ativo: boolean;
}
