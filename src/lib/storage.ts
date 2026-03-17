import { VehicleRecord } from "./types";

const STORAGE_KEY = "frota_records";

function getAll(): VehicleRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw).map((r: VehicleRecord) => ({ ...r, timestamp: new Date(r.timestamp) }));
}

function saveAll(records: VehicleRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function salvarDados(record: Omit<VehicleRecord, "id" | "timestamp" | "concluido">): string {
  const records = getAll();
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date(), concluido: false });
  saveAll(records);
  return "OK";
}

export function lerDados(dataFiltro: string): VehicleRecord[] {
  return getAll()
    .filter(r => {
      const d = new Date(r.timestamp);
      const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return formatted === dataFiltro;
    })
    .reverse();
}

export function toggleConcluido(id: string) {
  const records = getAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx].concluido = !records[idx].concluido;
    saveAll(records);
  }
}
