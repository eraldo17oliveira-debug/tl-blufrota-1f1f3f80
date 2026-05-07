import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Gera uma imagem PNG do monitoramento atual em estilo cyberpunk
export async function gerarImagemMonitoramento(): Promise<Blob> {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const { data: patio } = await supabase.from("patio").select("*").gte("created_at", `${hoje}T00:00:00`).lte("created_at", `${hoje}T23:59:59`);
  const { data: bloqueados } = await supabase.from("bloqueados" as any).select("*").eq("status", "BLOQUEADO");

  const ativos = (patio || []).filter((r: any) => !r.concluido);
  const placasNoPatio = new Set(ativos.map((r: any) => (r.placa || "").toUpperCase()));
  const virtuais = ((bloqueados as any[]) || [])
    .filter((b: any) => !placasNoPatio.has((b.placa || "").toUpperCase()))
    .map((b: any) => ({
      placa: b.placa, frota: b.frota || "", modelo: b.modelo || "", estado: "Vazia", local: "Pátio",
      status: "Bloqueio", motivo_bloqueio: b.motivo, created_at: b.data_bloqueio,
    }));
  const lista = [...ativos, ...virtuais];

  const totalPatio = lista.length;
  const totalCarga = lista.filter((r: any) => r.estado === "Carga").length;
  const totalVazias = lista.filter((r: any) => r.estado === "Vazia" && r.status !== "Bloqueio").length;
  const emBloqueio = lista.filter((r: any) => r.status === "Bloqueio");

  const W = 1080;
  const linhaH = 38;
  const headerH = 280;
  const bloqueioH = emBloqueio.length > 0 ? 60 + emBloqueio.length * 56 : 0;
  const tableH = 60 + lista.length * linhaH;
  const H = headerH + bloqueioH + tableH + 80;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fundo
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#050505"); grad.addColorStop(1, "#0a0a14");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Borda neon
  ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 15;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur = 0;

  // Título
  ctx.fillStyle = "#00ffff"; ctx.font = "bold 38px monospace";
  ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 12;
  ctx.fillText("🚚 TL-BLU FROTA — MONITORAMENTO", 30, 65);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#888"; ctx.font = "20px monospace";
  ctx.fillText(format(new Date(), "dd/MM/yyyy 'ÀS' HH:mm"), 30, 95);

  // Cards resumo
  const cards = [
    { l: "TOTAL PÁTIO", v: totalPatio, c: "#00ffff" },
    { l: "CARREGADAS", v: totalCarga, c: "#39ff14" },
    { l: "VAZIAS", v: totalVazias, c: "#ff8800" },
    { l: "BLOQUEADAS", v: emBloqueio.length, c: "#ff0044" },
  ];
  const cardW = (W - 60 - 30) / 4;
  cards.forEach((c, i) => {
    const x = 30 + i * (cardW + 10), y = 130;
    ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fillRect(x, y, cardW, 120);
    ctx.strokeStyle = c.c; ctx.lineWidth = 2; ctx.strokeRect(x, y, cardW, 120);
    ctx.fillStyle = c.c; ctx.font = "bold 56px monospace"; ctx.shadowColor = c.c; ctx.shadowBlur = 10;
    ctx.fillText(String(c.v), x + 20, y + 70);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa"; ctx.font = "bold 14px monospace";
    ctx.fillText(c.l, x + 20, y + 100);
  });

  let curY = headerH;

  // Bloqueios destacados
  if (emBloqueio.length > 0) {
    ctx.fillStyle = "rgba(255,0,68,0.15)"; ctx.fillRect(30, curY, W - 60, bloqueioH - 10);
    ctx.strokeStyle = "#ff0044"; ctx.lineWidth = 2; ctx.strokeRect(30, curY, W - 60, bloqueioH - 10);
    ctx.fillStyle = "#ff0044"; ctx.font = "bold 22px monospace";
    ctx.fillText(`⚠ ${emBloqueio.length} CARRETA(S) EM BLOQUEIO`, 50, curY + 35);
    emBloqueio.forEach((r: any, i: number) => {
      const dias = Math.max(1, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000));
      const y = curY + 60 + i * 56;
      ctx.fillStyle = "#ff0044"; ctx.font = "bold 16px monospace";
      ctx.fillText(`${dias} DIA${dias > 1 ? "S" : ""}`, 50, y + 22);
      ctx.fillStyle = "#00ffff"; ctx.font = "bold 22px monospace";
      ctx.fillText(r.placa, 160, y + 22);
      ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
      const motivo = (r.motivo_bloqueio || "").substring(0, 80);
      ctx.fillText(motivo, 50, y + 44);
    });
    curY += bloqueioH;
  }

  // Tabela
  ctx.fillStyle = "rgba(0,255,255,0.1)"; ctx.fillRect(30, curY, W - 60, 40);
  ctx.fillStyle = "#00ffff"; ctx.font = "bold 16px monospace";
  ["PLACA", "FROTA", "CARGA", "LOCAL", "STATUS", "MODELO"].forEach((h, i) => {
    ctx.fillText(h, 50 + i * 165, curY + 26);
  });
  curY += 50;

  lista.forEach((r: any, i: number) => {
    if (i % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(30, curY, W - 60, linhaH); }
    if (r.status === "Bloqueio") { ctx.fillStyle = "rgba(255,0,68,0.12)"; ctx.fillRect(30, curY, W - 60, linhaH); }
    ctx.font = "15px monospace";
    ctx.fillStyle = "#00ffff"; ctx.fillText(r.placa || "-", 50, curY + 25);
    ctx.fillStyle = "#fff"; ctx.fillText(r.frota || "-", 215, curY + 25);
    ctx.fillStyle = "#ccc"; ctx.fillText((r.estado || "-").toUpperCase(), 380, curY + 25);
    ctx.fillText((r.local || "-").toUpperCase(), 545, curY + 25);
    ctx.fillStyle = r.status === "Bloqueio" ? "#ff0044" : "#39ff14";
    ctx.fillText((r.status || "-").toUpperCase(), 710, curY + 25);
    ctx.fillStyle = "#ccc"; ctx.fillText((r.modelo || "-").toUpperCase(), 875, curY + 25);
    curY += linhaH;
  });

  // Footer
  ctx.fillStyle = "#666"; ctx.font = "13px monospace";
  ctx.fillText("GASPAR-SC • SISTEMA TL-BLU", 30, H - 30);

  return await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), "image/png"));
}

export function montarTextoResumo(): Promise<string> {
  return (async () => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    const { data: patio } = await supabase.from("patio").select("*").gte("created_at", `${hoje}T00:00:00`);
    const { data: bloqueados } = await supabase.from("bloqueados" as any).select("*").eq("status", "BLOQUEADO");
    const ativos = (patio || []).filter((r: any) => !r.concluido);
    const total = ativos.length;
    const cargas = ativos.filter((r: any) => r.estado === "Carga").length;
    const vazias = ativos.filter((r: any) => r.estado === "Vazia" && r.status !== "Bloqueio").length;
    const bloq = (bloqueados as any[])?.length || 0;
    return `*🚚 TL-BLU FROTA — MONITORAMENTO*\n${format(new Date(), "dd/MM/yyyy HH:mm")}\n\n📊 *RESUMO:*\n• TOTAL PÁTIO: ${total}\n• CARREGADAS: ${cargas}\n• VAZIAS: ${vazias}\n• BLOQUEADAS: ${bloq}`;
  })();
}
