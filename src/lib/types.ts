export type UserRole = "SUPERVISOR" | "MANOBRA" | "MANUTENÇÃO";

export interface UserSession {
  nome: string;
  perfil: UserRole;
}

// Module access map
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  SUPERVISOR: ["patio", "rodizio", "combustivel", "inventario", "fornecedores"],
  MANOBRA: ["patio"],
  "MANUTENÇÃO": ["rodizio", "inventario"],
};

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
  km: string;
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
export type PneuStatus = "ESTOQUE" | "RECAPAGEM" | "SUCATA";

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
