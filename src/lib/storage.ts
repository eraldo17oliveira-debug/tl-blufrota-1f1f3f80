import { supabase } from "@/integrations/supabase/client";

// ── helpers ──
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Pátio ──
export async function salvarPatio(record: { placa: string; frota: string; modelo: string; eixo: string; estado: string; local: string; status: string; motivo_bloqueio?: string; doca?: string }) {
  const { error } = await supabase.from("patio").insert(record as any);
  if (error) console.error(error);
}

export async function atualizarPatio(id: string, dados: { placa?: string; frota?: string; modelo?: string; eixo?: string; estado?: string; local?: string; status?: string; motivo_bloqueio?: string; doca?: string }) {
  const { error } = await supabase.from("patio").update(dados as any).eq("id", id);
  if (error) console.error(error);
}

export async function lerPatio(dataFiltro: string) {
  // Constrói intervalo no fuso local e converte para ISO (UTC) para alinhar com created_at do banco
  const [y, m, d] = dataFiltro.split("-").map(Number);
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  const { data, error } = await supabase.from("patio").select("*")
    .gte("created_at", startOfDay).lte("created_at", endOfDay)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function toggleConcluidoPatio(id: string) {
  const { data } = await supabase.from("patio").select("concluido").eq("id", id).single();
  if (data) {
    await supabase.from("patio").update({ concluido: !data.concluido }).eq("id", id);
  }
}

// ── Rodízio ──
export async function salvarRodizio(record: { placa: string; frota: string; posicao: string; num_fogo: string; lacre: string; sulco: string; tipo: string; marca?: string; serie?: string; dot?: string; modelo?: string }) {
  const { error } = await supabase.from("rodizio").insert(record as any);
  if (error) console.error(error);
}

export async function lerRodizio(de: string, ate: string) {
  const [y1, m1, d1] = de.split("-").map(Number);
  const [y2, m2, d2] = ate.split("-").map(Number);
  const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0).toISOString();
  const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999).toISOString();
  const { data, error } = await supabase.from("rodizio").select("*")
    .gte("created_at", start).lte("created_at", end)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function atualizarRodizio(id: string, dados: { placa?: string; frota?: string; posicao?: string; num_fogo?: string; lacre?: string; tipo?: string; marca?: string; serie?: string; dot?: string; modelo?: string; sulco?: string }) {
  const { error } = await supabase.from("rodizio").update(dados as any).eq("id", id);
  if (error) console.error(error);
}

export async function excluirRodizio(id: string) {
  const { error } = await supabase.from("rodizio").delete().eq("id", id);
  if (error) console.error(error);
}

// ── Fornecedores ──
export async function salvarFornecedor(record: { razao_social: string; cnpj_cpf: string; tipo: string; telefone: string; cidade_estado: string; observacoes: string }) {
  const { error } = await supabase.from("fornecedores").insert(record);
  if (error) console.error(error);
}

export async function lerFornecedores() {
  const { data, error } = await supabase.from("fornecedores").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function lerFornecedoresPorTipo(tipo: string) {
  const { data, error } = await supabase.from("fornecedores").select("*").eq("tipo", tipo).order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function atualizarFornecedor(id: string, dados: { razao_social?: string; cnpj_cpf?: string; tipo?: string; telefone?: string; cidade_estado?: string; observacoes?: string }) {
  const { error } = await supabase.from("fornecedores").update(dados).eq("id", id);
  if (error) console.error(error);
}

export async function excluirFornecedor(id: string) {
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) console.error(error);
}

// ── Serviços Internos (OS) ──
export async function salvarOS(record: { frota: string; placa: string; item_peca: string; quantidade: number; mecanico: string; descricao: string; status: string; tipo_servico: string; local_servico: string }) {
  const { error } = await supabase.from("servicos_internos" as any).insert(record as any);
  if (error) console.error(error);
}

export async function lerOS() {
  const { data, error } = await supabase.from("servicos_internos" as any).select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data as any[]) || [];
}

export async function atualizarStatusOS(id: string, status: string) {
  const { error } = await supabase.from("servicos_internos" as any).update({ status } as any).eq("id", id);
  if (error) console.error(error);
}

// ── Buscar último registro por placa ──
export async function buscarUltimoPatio(placa: string) {
  const clean = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length < 7) return null;
  const { data } = await supabase.from("patio").select("*")
    .ilike("placa", `%${clean.slice(0,3)}%${clean.slice(3)}%`)
    .order("created_at", { ascending: false }).limit(1);
  return data && data.length > 0 ? data[0] : null;
}

export async function buscarUltimaLavacao(placa: string) {
  const clean = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length < 7) return null;
  const { data } = await supabase.from("lavacao").select("*")
    .ilike("placa", `%${clean.slice(0,3)}%${clean.slice(3)}%`)
    .order("created_at", { ascending: false }).limit(1);
  return data && data.length > 0 ? data[0] : null;
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
