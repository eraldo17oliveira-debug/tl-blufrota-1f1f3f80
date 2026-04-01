import { supabase } from "@/integrations/supabase/client";

// ── helpers ──
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Pátio ──
export async function salvarPatio(record: { placa: string; frota: string; modelo: string; eixo: string; estado: string; local: string; status: string; motivo_bloqueio?: string }) {
  const { error } = await supabase.from("patio").insert(record);
  if (error) console.error(error);
}

export async function atualizarPatio(id: string, dados: { placa?: string; frota?: string; modelo?: string; eixo?: string; estado?: string; local?: string; status?: string; motivo_bloqueio?: string }) {
  const { error } = await supabase.from("patio").update(dados).eq("id", id);
  if (error) console.error(error);
}

export async function lerPatio(dataFiltro: string) {
  const startOfDay = `${dataFiltro}T00:00:00`;
  const endOfDay = `${dataFiltro}T23:59:59`;
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
export async function salvarRodizio(record: { placa: string; frota: string; posicao: string; num_fogo: string; lacre: string; sulco: string; tipo: string }) {
  const { error } = await supabase.from("rodizio").insert(record);
  if (error) console.error(error);
}

export async function lerRodizio(de: string, ate: string) {
  const { data, error } = await supabase.from("rodizio").select("*")
    .gte("created_at", `${de}T00:00:00`).lte("created_at", `${ate}T23:59:59`)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
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

// ── CSV Export utility ──
export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
