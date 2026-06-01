import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Users, Send, Building2 } from "lucide-react";
import { compartilharRelatorio } from "@/components/WhatsappAgendador";
import { gerarImagemMonitoramento, montarTextoResumo } from "@/lib/whatsappReport";

export default function RelatorioConfigPage() {
  const [contatos, setContatos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [novoFone, setNovoFone] = useState("");
  const [novoHora, setNovoHora] = useState("");

  const carregar = async () => {
    const { data: c } = await supabase.from("whatsapp_contatos" as any).select("*").order("created_at");
    const { data: h } = await supabase.from("whatsapp_horarios" as any).select("*").order("hora");
    setContatos((c as any[]) || []);
    setHorarios((h as any[]) || []);
  };
  useEffect(() => { carregar(); }, []);

  const addContato = async () => {
    if (!novoNome.trim() || !novoFone.trim()) { toast.error("PREENCHA NOME E TELEFONE!"); return; }
    const fone = novoFone.replace(/\D/g, "");
    if (fone.length < 10) { toast.error("TELEFONE INVÁLIDO!"); return; }
    await supabase.from("whatsapp_contatos" as any).insert({
      nome: novoNome.toUpperCase(), telefone: fone.startsWith("55") ? fone : `55${fone}`, ativo: true,
    } as any);
    setNovoNome(""); setNovoFone(""); toast.success("CONTATO ADICIONADO!"); carregar();
  };

  const addHorario = async () => {
    if (!/^\d{2}:\d{2}$/.test(novoHora)) { toast.error("FORMATO HH:MM!"); return; }
    await supabase.from("whatsapp_horarios" as any).insert({ hora: novoHora, ativo: true } as any);
    setNovoHora(""); toast.success("HORÁRIO ADICIONADO!"); carregar();
  };

  const toggleContato = async (r: any) => {
    await supabase.from("whatsapp_contatos" as any).update({ ativo: !r.ativo }).eq("id", r.id);
    carregar();
  };
  const toggleHorario = async (r: any) => {
    await supabase.from("whatsapp_horarios" as any).update({ ativo: !r.ativo }).eq("id", r.id);
    carregar();
  };
  const delContato = async (id: string) => { await supabase.from("whatsapp_contatos" as any).delete().eq("id", id); carregar(); };
  const delHorario = async (id: string) => { await supabase.from("whatsapp_horarios" as any).delete().eq("id", id); carregar(); };

  const enviarParaTodos = async () => {
    const ativos = contatos.filter(c => c.ativo);
    if (ativos.length === 0) { toast.error("NENHUMA UNIDADE/CONTATO ATIVO!"); return; }
    try {
      const blob = await gerarImagemMonitoramento();
      const texto = await montarTextoResumo();
      const file = new File([blob], `monitoramento_${Date.now()}.png`, { type: "image/png" });

      // Baixa a imagem (1x) para o usuário anexar manualmente
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 8000);

      const msg = encodeURIComponent(texto + "\n\n📎 IMAGEM BAIXADA — ANEXE NO WHATSAPP");

      toast.success(`📤 ABRINDO WHATSAPP PARA ${ativos.length} UNIDADE(S)...`);
      // Abre uma janela por contato em sequência (com pequeno delay)
      ativos.forEach((c, i) => {
        const fone = (c.telefone || "").replace(/\D/g, "");
        setTimeout(() => {
          window.open(`https://wa.me/${fone}?text=${msg}`, "_blank");
        }, i * 700);
      });
    } catch (e: any) {
      toast.error("ERRO: " + e.message);
    }
  };


  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold text-primary neon-text">📲 RELATÓRIO WHATSAPP</h1>

      <Card className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Send className="h-4 w-4" />
          <span className="font-orbitron text-sm font-bold uppercase">TESTE AGORA</span>
        </div>
        <p className="text-xs text-muted-foreground font-orbitron">
          GERA A IMAGEM E ABRE O WHATSAPP PARA ENVIAR.
        </p>
        <Button onClick={compartilharRelatorio} className="w-full font-orbitron uppercase gap-2 neon-glow-green bg-accent text-accent-foreground hover:bg-accent/80 h-12">
          <Send className="h-4 w-4" /> ENVIAR RELATÓRIO AGORA
        </Button>
      </Card>

      <Card className="glass-card p-5 space-y-3" style={{ background: "linear-gradient(135deg, hsl(200 100% 50% / 0.08), transparent)", borderColor: "hsl(200 100% 50% / 0.4)" }}>
        <div className="flex items-center gap-2" style={{ color: "hsl(200 100% 65%)" }}>
          <Building2 className="h-4 w-4" />
          <span className="font-orbitron text-sm font-bold uppercase">ENVIAR PARA OUTRAS UNIDADES</span>
        </div>
        <p className="text-xs text-muted-foreground font-orbitron uppercase">
          DISPARA O RELATÓRIO DE CARRETAS PARA TODOS OS CONTATOS ATIVOS ABAIXO (CADA UNIDADE EM UMA ABA DO WHATSAPP).
        </p>
        <Button onClick={enviarParaTodos} className="w-full font-orbitron uppercase gap-2 h-12" style={{ background: "hsl(200 100% 45%)", color: "hsl(220 50% 8%)" }}>
          <Building2 className="h-4 w-4" /> ENVIAR PARA TODAS AS UNIDADES ({contatos.filter(c => c.ativo).length})
        </Button>
      </Card>

      <Card className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="h-4 w-4" />
          <span className="font-orbitron text-sm font-bold uppercase">HORÁRIOS DE AVISO</span>
        </div>
        <div className="flex gap-2">
          <Input type="time" value={novoHora} onChange={e => setNovoHora(e.target.value)}
            className="font-orbitron bg-input border-border/50 h-11" />
          <Button onClick={addHorario} className="gap-1 font-orbitron uppercase"><Plus className="h-4 w-4" /> ADD</Button>
        </div>
        <div className="space-y-2">
          {horarios.length === 0 && <p className="text-xs text-muted-foreground font-orbitron text-center py-3 uppercase">NENHUM HORÁRIO</p>}
          {horarios.map(h => (
            <div key={h.id} className="flex items-center gap-3 bg-background/40 rounded-lg p-3 border border-border/30">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-orbitron text-lg text-primary flex-1">{(h.hora || "").slice(0, 5)}</span>
              <Switch checked={h.ativo} onCheckedChange={() => toggleHorario(h)} />
              <Button variant="ghost" size="icon" onClick={() => delHorario(h.id)} className="text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-[0.65rem] text-muted-foreground font-orbitron uppercase">
          ⚠ MANTENHA O APP ABERTO OU INSTALADO NO CELULAR PARA RECEBER A NOTIFICAÇÃO.
        </p>
      </Card>

      <Card className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-4 w-4" />
          <span className="font-orbitron text-sm font-bold uppercase">CONTATOS WHATSAPP</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input placeholder="NOME" value={novoNome} onChange={e => setNovoNome(e.target.value)}
            className="uppercase font-orbitron bg-input border-border/50 h-11" />
          <Input placeholder="TELEFONE (DDD+NÚMERO)" value={novoFone} onChange={e => setNovoFone(e.target.value)}
            className="font-orbitron bg-input border-border/50 h-11" />
          <Button onClick={addContato} className="gap-1 font-orbitron uppercase"><Plus className="h-4 w-4" /> ADD</Button>
        </div>
        <div className="space-y-2">
          {contatos.length === 0 && <p className="text-xs text-muted-foreground font-orbitron text-center py-3 uppercase">NENHUM CONTATO</p>}
          {contatos.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-background/40 rounded-lg p-3 border border-border/30">
              <div className="flex-1">
                <div className="font-orbitron text-sm uppercase">{c.nome}</div>
                <div className="font-mono text-xs text-muted-foreground">{c.telefone}</div>
              </div>
              <Switch checked={c.ativo} onCheckedChange={() => toggleContato(c)} />
              <Button variant="ghost" size="icon" onClick={() => delContato(c.id)} className="text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
