import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { gerarImagemMonitoramento, montarTextoResumo } from "@/lib/whatsappReport";
import { toast } from "sonner";

const LAST_KEY = "tlblu_wa_last_trigger";

// Pede permissão de notificação ao iniciar
async function pedirPermissaoNotif() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch {}
  }
}

async function compartilharRelatorio() {
  try {
    const blob = await gerarImagemMonitoramento();
    const texto = await montarTextoResumo();
    const file = new File([blob], `monitoramento_${Date.now()}.png`, { type: "image/png" });

    // Web Share API com arquivo (Android/iOS)
    const navAny = navigator as any;
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navAny.share({ files: [file], text: texto, title: "MONITORAMENTO TL-BLU" });
      return;
    }

    // Fallback: baixa imagem e abre WhatsApp com texto
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    const { data: contatos } = await supabase.from("whatsapp_contatos" as any).select("*").eq("ativo", true);
    if (contatos && contatos.length > 0) {
      const fone = (contatos[0] as any).telefone.replace(/\D/g, "");
      window.open(`https://wa.me/${fone}?text=${encodeURIComponent(texto + "\n\n📎 IMAGEM BAIXADA — ANEXE NO WHATSAPP")}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
    }
  } catch (e: any) {
    toast.error("ERRO AO GERAR RELATÓRIO: " + e.message);
  }
}

export default function WhatsappAgendador() {
  const [horarios, setHorarios] = useState<any[]>([]);

  useEffect(() => { pedirPermissaoNotif(); }, []);

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from("whatsapp_horarios" as any).select("*").eq("ativo", true);
      setHorarios((data as any[]) || []);
    };
    carregar();
    const ch = supabase.channel("wa-horarios")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_horarios" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const checar = () => {
      if (horarios.length === 0) return;
      const agora = new Date();
      const hhmm = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
      const chave = `${agora.toISOString().slice(0, 10)}_${hhmm}`;
      const ultimo = localStorage.getItem(LAST_KEY);
      if (ultimo === chave) return;
      const match = horarios.find(h => (h.hora || "").slice(0, 5) === hhmm);
      if (!match) return;
      localStorage.setItem(LAST_KEY, chave);

      // Dispara notificação no celular
      if ("Notification" in window && Notification.permission === "granted") {
        const n = new Notification("🚚 RELATÓRIO TL-BLU PRONTO!", {
          body: `Toque para enviar o monitoramento das ${hhmm} no WhatsApp`,
          icon: "/icon-192.png", tag: "tlblu-report", requireInteraction: true,
        });
        n.onclick = () => { window.focus(); compartilharRelatorio(); n.close(); };
      }
      // Toast também (caso esteja com app aberto)
      toast.info(`⏰ HORÁRIO ${hhmm} — TOQUE PARA ENVIAR RELATÓRIO`, {
        duration: 60000, action: { label: "ENVIAR", onClick: compartilharRelatorio },
      });
    };
    const id = setInterval(checar, 30000);
    checar();
    return () => clearInterval(id);
  }, [horarios]);

  return null;
}

export { compartilharRelatorio };
