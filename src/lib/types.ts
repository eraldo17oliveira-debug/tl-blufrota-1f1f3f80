export type UserRole = "SUPERVISOR" | "MANOBRA" | "MANUTENÇÃO" | "EXPEDIÇÃO";

export interface UserPermissions {
  patio: boolean;
  rodizio: boolean;
  combustivel: boolean;
  inventario: boolean;
  fornecedores: boolean;
  expedicao: boolean;
  gerarPdf: boolean;
  gerarExcel: boolean;
}

export interface UserSession {
  nome: string;
  perfil: UserRole;
  permissoes: UserPermissions;
}

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  SUPERVISOR: {
    patio: true, rodizio: true, combustivel: true, inventario: true,
    fornecedores: true, expedicao: true, gerarPdf: true, gerarExcel: true,
  },
  MANOBRA: {
    patio: true, rodizio: false, combustivel: false, inventario: false,
    fornecedores: false, expedicao: false, gerarPdf: true, gerarExcel: false,
  },
  "MANUTENÇÃO": {
    patio: false, rodizio: true, combustivel: false, inventario: true,
    fornecedores: false, expedicao: false, gerarPdf: true, gerarExcel: false,
  },
  "EXPEDIÇÃO": {
    patio: false, rodizio: false, combustivel: false, inventario: false,
    fornecedores: false, expedicao: true, gerarPdf: true, gerarExcel: true,
  },
};

// Module access derived from permissions
export function getModuleAccess(permissoes: UserPermissions): string[] {
  const modules: string[] = [];
  if (permissoes.patio) modules.push("patio");
  if (permissoes.rodizio) modules.push("rodizio");
  if (permissoes.combustivel) modules.push("combustivel");
  if (permissoes.inventario) modules.push("inventario");
  if (permissoes.fornecedores) modules.push("fornecedores");
  if (permissoes.expedicao) modules.push("expedicao");
  return modules;
}

// --- Pátio ---
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

// --- Rodízio de Pneus ---
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

// --- Combustível ---
export interface CombustivelFechamento {
  id: string;
  data: string;
  leituraInicial: number;
  leituraFinal: number;
  consumo: number;
}

export interface CombustivelCarga {
  id: string;
  timestamp: Date;
  litros: number;
  fornecedorId: string;
  fornecedorNome: string;
  notaFiscal: string;
}

// --- Inventário ---
export type PneuStatus = "DISPONÍVEL" | "RECAPAGEM" | "SUCATA";

export interface PneuInventario {
  id: string;
  timestamp: Date;
  numFogo: string;
  tamanho: string;
  largura: string;
  aro: string;
  marca: string;
  fornecedorId: string;
  fornecedorNome: string;
  status: PneuStatus;
}

// --- Fornecedores ---
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

// --- Registered Users (for management) ---
export interface RegisteredUser {
  id: string;
  nome: string;
  senha: string;
  perfil: UserRole;
  permissoes: UserPermissions;
  ativo: boolean;
}
