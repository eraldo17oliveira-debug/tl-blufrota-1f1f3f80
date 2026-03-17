export interface VehicleRecord {
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

export interface UserSession {
  nome: string;
  perfil: "ADMIN" | "RESTRITO";
}
