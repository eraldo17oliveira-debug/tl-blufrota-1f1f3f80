export type UserRole = "SUPERVISOR" | "MANOBRA" | "MANUTENÇÃO";

export interface UserSession {
  nome: string;
  perfil: UserRole;
}

// Module access map
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  SUPERVISOR: ["patio", "rodizio", "combustivel", "inventario"],
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
  numFogo: string;
  lacre: string;
  km: string;
  sulco: string;
  posicao: string;
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
  fornecedor: string;
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
  status: PneuStatus;
}
