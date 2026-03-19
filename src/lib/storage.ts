import { PatioRecord, RodizioRecord, CombustivelFechamento, CombustivelCarga, PneuInventario, Fornecedor } from "./types";

// ── helpers ──
function getAll<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw);
}
function saveAll<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
function filterByDate<T extends { timestamp: string | Date }>(items: T[], dataFiltro: string) {
  return items.filter(r => {
    const d = new Date(r.timestamp);
    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return f === dataFiltro;
  });
}
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Pátio ──
const PATIO_KEY = "frota_patio";

export function salvarPatio(record: Omit<PatioRecord, "id" | "timestamp" | "concluido">) {
  const records = getAll<PatioRecord>(PATIO_KEY);
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date() as any, concluido: false });
  saveAll(PATIO_KEY, records);
}

export function lerPatio(dataFiltro: string): PatioRecord[] {
  return filterByDate(getAll<PatioRecord>(PATIO_KEY), dataFiltro)
    .map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    .reverse();
}

export function toggleConcluidoPatio(id: string) {
  const records = getAll<PatioRecord>(PATIO_KEY);
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) { records[idx].concluido = !records[idx].concluido; saveAll(PATIO_KEY, records); }
}

// ── Rodízio ──
const RODIZIO_KEY = "frota_rodizio";

export function salvarRodizio(record: Omit<RodizioRecord, "id" | "timestamp">) {
  const records = getAll<RodizioRecord>(RODIZIO_KEY);
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date() as any });
  saveAll(RODIZIO_KEY, records);
}

export function lerRodizio(de: string, ate: string): RodizioRecord[] {
  return getAll<RodizioRecord>(RODIZIO_KEY)
    .filter(r => {
      const d = new Date(r.timestamp);
      const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return f >= de && f <= ate;
    })
    .map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    .reverse();
}

// ── Combustível ──
const COMB_FECH_KEY = "frota_comb_fechamento";
const COMB_CARGA_KEY = "frota_comb_carga";

export function salvarFechamento(record: Omit<CombustivelFechamento, "id" | "consumo">) {
  const records = getAll<CombustivelFechamento>(COMB_FECH_KEY);
  const consumo = record.leituraFinal - record.leituraInicial;
  records.push({ ...record, id: crypto.randomUUID(), consumo });
  saveAll(COMB_FECH_KEY, records);
}

export function lerFechamentos(): CombustivelFechamento[] {
  return getAll<CombustivelFechamento>(COMB_FECH_KEY).reverse();
}

export function salvarCarga(record: Omit<CombustivelCarga, "id" | "timestamp">) {
  const records = getAll<CombustivelCarga>(COMB_CARGA_KEY);
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date() as any });
  saveAll(COMB_CARGA_KEY, records);
}

export function lerCargas(): CombustivelCarga[] {
  return getAll<CombustivelCarga>(COMB_CARGA_KEY)
    .map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    .reverse();
}

export function volumeAtual(): number {
  const cargas = getAll<CombustivelCarga>(COMB_CARGA_KEY);
  const fechamentos = getAll<CombustivelFechamento>(COMB_FECH_KEY);
  const totalEntrada = cargas.reduce((s, c) => s + c.litros, 0);
  const totalConsumo = fechamentos.reduce((s, f) => s + f.consumo, 0);
  return totalEntrada - totalConsumo;
}

// ── Inventário ──
const INV_KEY = "frota_inventario";

export function salvarPneu(record: Omit<PneuInventario, "id" | "timestamp">) {
  const records = getAll<PneuInventario>(INV_KEY);
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date() as any });
  saveAll(INV_KEY, records);
}

export function lerPneus(): PneuInventario[] {
  return getAll<PneuInventario>(INV_KEY)
    .map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    .reverse();
}

export function atualizarStatusPneu(id: string, status: PneuInventario["status"]) {
  const records = getAll<PneuInventario>(INV_KEY);
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) { records[idx].status = status; saveAll(INV_KEY, records); }
}

// ── Fornecedores ──
const FORN_KEY = "frota_fornecedores";

export function salvarFornecedor(record: Omit<Fornecedor, "id" | "timestamp">) {
  const records = getAll<Fornecedor>(FORN_KEY);
  records.push({ ...record, id: crypto.randomUUID(), timestamp: new Date() as any });
  saveAll(FORN_KEY, records);
}

export function lerFornecedores(): Fornecedor[] {
  return getAll<Fornecedor>(FORN_KEY)
    .map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    .reverse();
}

export function lerFornecedoresPorTipo(tipo: string): Fornecedor[] {
  return lerFornecedores().filter(f => f.tipo === tipo);
}

export function atualizarFornecedor(id: string, data: Partial<Fornecedor>) {
  const records = getAll<Fornecedor>(FORN_KEY);
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) { Object.assign(records[idx], data); saveAll(FORN_KEY, records); }
}

export function excluirFornecedor(id: string) {
  const records = getAll<Fornecedor>(FORN_KEY);
  saveAll(FORN_KEY, records.filter(r => r.id !== id));
}

// ── CSV Export utility ──
export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
