import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PlacaInput from "@/components/PlacaInput";
import { UserSession } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Send, Trash2, Edit2, Check, X, Phone, UserPlus, Car } from "lucide-react";
import { format } from "date-fns";

interface LavacaoRecord {
  id: string;
  placa: string;
  frota: string;
  tipo_veiculo: string;
  valor: number;
  status: string;
  data_lavacao: string;
  observacoes: string;
  created_at: string;
}

interface ContatoRecord {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

const TIPOS_VEICULO = ["CARRETA", "CAVALO", "TRUCK", "TOCO", "VAN", "UTILITÁRIO", "CARRO"];
const STATUS_OPTIONS = ["PENDENTE", "EM LAVAÇÃO", "CONCLUÍDO"];

export default function LavacaoPage({ session }: { session: UserSession }) {
  const [registros, setRegistros] = useState<LavacaoRecord[]>([]);
  const [contatos, setContatos] = useState<ContatoRecord[]>([]);
  const [tab, setTab] = useState<"cadastro" | "gestao" | "contatos">("cadastro");

  // Form
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [tipo, setTipo] = useState("CARRETA");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [dataLavacao, setDataLavacao] = useState(format(new Date(), "yyyy-MM-dd"));

  // Contato form
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTel, setContatoTel] = useState("");

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LavacaoRecord>>({});

  // Filter
  const [filtroData, setFiltroData] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => { carregar(); carregarContatos(); }, [filtroData]);

  async function carregar() {
    const { data } = await supabase.from("lavacao" as any).select("*")
      .eq("data_lavacao", filtroData)
      .order("created_at", { ascending: false });
    setRegistros((data as any[]) || []);
  }

  async function carregarContatos() {
    const { data } = await supabase.from("lavacao_contatos" as any).select("*").order("created_at", { ascending: false });
    setContatos((data as any[]) || []);
  }

  async function cadastrar() {
    if (!placa) { toast.error("INFORME A PLACA!"); return; }
    const { error } = await supabase.from("lavacao" as any).insert({
      placa, frota, tipo_veiculo: tipo, valor: parseFloat(valor) || 0,
      observacoes: obs, data_lavacao: dataLavacao, status: "PENDENTE",
    } as any);
    if (error) { toast.error("ERRO AO CADASTRAR!"); return; }
    toast.success("VEÍCULO CADASTRADO!");
    setPlaca(""); setFrota(""); setValor(""); setObs("");
    carregar();
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from("lavacao" as any).update({ status } as any).eq("id", id);
    carregar();
    toast.success(`STATUS: ${status}`);
  }

  async function excluir(id: string) {
    await supabase.from("lavacao" as any).delete().eq("id", id);
    carregar();
    toast.success("REGISTRO EXCLUÍDO!");
  }

  async function salvarEdicao(id: string) {
    await supabase.from("lavacao" as any).update(editData as any).eq("id", id);
    setEditId(null);
    carregar();
    toast.success("ATUALIZADO!");
  }

  async function addContato() {
    if (!contatoNome || !contatoTel) { toast.error("PREENCHA NOME E TELEFONE!"); return; }
    await supabase.from("lavacao_contatos" as any).insert({ nome: contatoNome, telefone: contatoTel } as any);
    setContatoNome(""); setContatoTel("");
    carregarContatos();
    toast.success("CONTATO ADICIONADO!");
  }

  async function excluirContato(id: string) {
    await supabase.from("lavacao_contatos" as any).delete().eq("id", id);
    carregarContatos();
    toast.success("CONTATO REMOVIDO!");
  }

  function enviarWhatsApp() {
    const pendentes = registros.filter(r => r.status !== "CONCLUÍDO");
    if (!pendentes.length) { toast.error("NENHUM VEÍCULO PENDENTE!"); return; }
    const contatosAtivos = contatos.filter(c => c.ativo);
    if (!contatosAtivos.length) { toast.error("NENHUM CONTATO CADASTRADO!"); return; }

    const msg = `🚿 *LAVAÇÃO TL-BLU - ${filtroData}*\n\n` +
      pendentes.map((r, i) => `${i + 1}. *${r.placa}* | ${r.frota} | ${r.tipo_veiculo} | R$ ${r.valor.toFixed(2)}`).join("\n") +
      `\n\n📊 *TOTAL: ${pendentes.length} VEÍCULO(S)*`;

    contatosAtivos.forEach(c => {
      const tel = c.telefone.replace(/\D/g, "");
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }

  const totalHoje = registros.length;
  const totalConcluidos = registros.filter(r => r.status === "CONCLUÍDO").length;
  const totalPendentes = registros.filter(r => r.status === "PENDENTE").length;
  const totalValor = registros.reduce((s, r) => s + (r.valor || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="font-orbitron text-xl text-primary neon-text uppercase tracking-wider flex items-center gap-2">
        <Car className="h-6 w-6" /> LAVAÇÃO DE VEÍCULOS
      </h1>

      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL HOJE", value: totalHoje, color: "text-primary" },
          { label: "CONCLUÍDOS", value: totalConcluidos, color: "text-green-400" },
          { label: "PENDENTES", value: totalPendentes, color: "text-orange-400" },
          { label: "VALOR TOTAL", value: `R$ ${totalValor.toFixed(2)}`, color: "text-primary" },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-3 text-center border border-border/30">
            <div className={`font-orbitron text-lg font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "cadastro", label: "CADASTRAR", icon: Plus },
          { key: "gestao", label: "GESTÃO", icon: Edit2 },
          { key: "contatos", label: "WHATSAPP", icon: Phone },
        ] as const).map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)} className="uppercase font-orbitron text-xs gap-1">
            <t.icon className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {/* CADASTRO */}
      {tab === "cadastro" && (
        <div className="glass-card rounded-xl p-4 border border-border/30 space-y-3">
          <h2 className="font-orbitron text-sm text-primary uppercase">CADASTRAR VEÍCULO PARA LAVAÇÃO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PlacaInput value={placa} onChange={setPlaca} />
            <Input placeholder="FROTA" value={frota} onChange={e => setFrota(e.target.value.toUpperCase())}
              className="uppercase h-12 text-center font-orbitron bg-input border-border" />
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="h-12 rounded-md border border-border bg-input px-3 text-sm font-orbitron uppercase text-foreground">
              {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input placeholder="VALOR (R$)" type="number" step="0.01" value={valor}
              onChange={e => setValor(e.target.value)}
              className="h-12 text-center font-orbitron bg-input border-border" />
            <Input type="date" value={dataLavacao} onChange={e => setDataLavacao(e.target.value)}
              className="h-12 text-center font-orbitron bg-input border-border" />
          </div>
          <Textarea placeholder="OBSERVAÇÕES..." value={obs} onChange={e => setObs(e.target.value.toUpperCase())}
            className="uppercase font-orbitron text-xs bg-input border-border" />
          <Button onClick={cadastrar} className="w-full h-12 neon-button font-orbitron uppercase text-sm tracking-wider gap-2">
            <Plus className="h-5 w-5" /> REGISTRAR LAVAÇÃO
          </Button>
        </div>
      )}

      {/* GESTÃO */}
      {tab === "gestao" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
              className="h-10 w-48 font-orbitron text-xs bg-input border-border" />
            <Button onClick={enviarWhatsApp} className="neon-button-green font-orbitron text-xs uppercase gap-1 h-10">
              <Send className="h-4 w-4" /> ENVIAR WHATSAPP
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-orbitron uppercase">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="p-2 text-left">PLACA</th>
                  <th className="p-2 text-left">FROTA</th>
                  <th className="p-2 text-left">TIPO</th>
                  <th className="p-2 text-right">VALOR</th>
                  <th className="p-2 text-center">STATUS</th>
                  <th className="p-2 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-primary/5">
                    {editId === r.id ? (
                      <>
                        <td className="p-1"><Input value={editData.placa ?? r.placa} onChange={e => setEditData({ ...editData, placa: e.target.value.toUpperCase() })} className="h-8 text-xs bg-input" /></td>
                        <td className="p-1"><Input value={editData.frota ?? r.frota} onChange={e => setEditData({ ...editData, frota: e.target.value.toUpperCase() })} className="h-8 text-xs bg-input" /></td>
                        <td className="p-1">
                          <select value={editData.tipo_veiculo ?? r.tipo_veiculo} onChange={e => setEditData({ ...editData, tipo_veiculo: e.target.value })}
                            className="h-8 rounded border border-border bg-input px-1 text-xs text-foreground">
                            {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="p-1"><Input type="number" value={editData.valor ?? r.valor} onChange={e => setEditData({ ...editData, valor: parseFloat(e.target.value) || 0 })} className="h-8 text-xs bg-input text-right" /></td>
                        <td className="p-1 text-center">
                          <select value={editData.status ?? r.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
                            className="h-8 rounded border border-border bg-input px-1 text-xs text-foreground">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-1 text-center flex gap-1 justify-center">
                          <Button size="icon" variant="ghost" onClick={() => salvarEdicao(r.id)} className="h-7 w-7 text-green-400"><Check className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditId(null)} className="h-7 w-7 text-destructive"><X className="h-3 w-3" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 text-primary font-bold">{r.placa}</td>
                        <td className="p-2">{r.frota}</td>
                        <td className="p-2">{r.tipo_veiculo}</td>
                        <td className="p-2 text-right">R$ {(r.valor || 0).toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <select value={r.status} onChange={e => atualizarStatus(r.id, e.target.value)}
                            className={`h-7 rounded border text-[0.6rem] px-1 bg-input border-border text-foreground
                              ${r.status === "CONCLUÍDO" ? "text-green-400 border-green-400/30" : r.status === "EM LAVAÇÃO" ? "text-primary border-primary/30" : "text-orange-400 border-orange-400/30"}`}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2 text-center flex gap-1 justify-center">
                          <Button size="icon" variant="ghost" onClick={() => { setEditId(r.id); setEditData({}); }} className="h-7 w-7 text-primary"><Edit2 className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => excluir(r.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {!registros.length && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-xs">NENHUM REGISTRO PARA ESTA DATA</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTATOS WHATSAPP */}
      {tab === "contatos" && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 border border-border/30 space-y-3">
            <h2 className="font-orbitron text-sm text-primary uppercase flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> CADASTRAR CONTATO WHATSAPP
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="NOME" value={contatoNome} onChange={e => setContatoNome(e.target.value.toUpperCase())}
                className="h-12 uppercase font-orbitron bg-input border-border" />
              <Input placeholder="TELEFONE (DDD + NÚMERO)" value={contatoTel}
                onChange={e => setContatoTel(e.target.value.replace(/\D/g, ""))}
                className="h-12 font-orbitron bg-input border-border" />
            </div>
            <Button onClick={addContato} className="w-full h-12 neon-button-green font-orbitron uppercase text-sm gap-2">
              <UserPlus className="h-5 w-5" /> ADICIONAR CONTATO
            </Button>
          </div>

          <div className="space-y-2">
            {contatos.map(c => (
              <div key={c.id} className="glass-card rounded-lg p-3 border border-border/30 flex items-center justify-between">
                <div>
                  <span className="font-orbitron text-xs text-primary font-bold">{c.nome}</span>
                  <span className="ml-3 text-xs text-muted-foreground font-orbitron">{c.telefone}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => window.open(`https://wa.me/55${c.telefone}`, "_blank")}
                    className="h-8 w-8 text-green-400 hover:text-green-300">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => excluirContato(c.id)}
                    className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!contatos.length && (
              <div className="text-center text-muted-foreground text-xs font-orbitron p-4 uppercase">
                NENHUM CONTATO CADASTRADO
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
