import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PlacaInput from "@/components/PlacaInput";
import { UserSession } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Send, Trash2, Edit2, Check, X, Phone, UserPlus, Car, FileText, Camera, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LavacaoRecord {
  id: string;
  placa: string;
  frota: string;
  tipo_veiculo: string;
  valor: number;
  status: string;
  data_lavacao: string;
  observacoes: string;
  enviado_lavacao: boolean;
  foto_lavado: string;
  created_at: string;
}

interface ContatoRecord {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

const TIPOS_VEICULO = ["CARRETA", "CAVALO", "TRUCK", "TOCO", "VAN", "UTILITÁRIO", "CARRO"];

export default function LavacaoPage({ session }: { session: UserSession }) {
  const isSupervisor = session.perfil === "SUPERVISOR";

  // If not supervisor, show the washer view
  if (!isSupervisor) {
    return <LavadorView />;
  }

  return <SupervisorView session={session} />;
}

// ─── SUPERVISOR VIEW ───
function SupervisorView({ session }: { session: UserSession }) {
  const [registros, setRegistros] = useState<LavacaoRecord[]>([]);
  const [contatos, setContatos] = useState<ContatoRecord[]>([]);
  const [tab, setTab] = useState<"cadastro" | "enviar" | "gestao" | "contatos">("cadastro");

  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [tipo, setTipo] = useState("CARRETA");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [dataLavacao, setDataLavacao] = useState(format(new Date(), "yyyy-MM-dd"));

  const [contatoNome, setContatoNome] = useState("");
  const [contatoTel, setContatoTel] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LavacaoRecord>>({});

  const [filtroData, setFiltroData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => { carregar(); carregarContatos(); }, [filtroData]);

  async function carregar() {
    const { data } = await supabase.from("lavacao").select("*")
      .eq("data_lavacao", filtroData)
      .order("created_at", { ascending: false });
    setRegistros((data as any[]) || []);
  }

  async function carregarContatos() {
    const { data } = await supabase.from("lavacao_contatos").select("*").order("created_at", { ascending: false });
    setContatos((data as any[]) || []);
  }

  async function cadastrar() {
    if (!placa) { toast.error("INFORME A PLACA!"); return; }
    const { error } = await supabase.from("lavacao").insert({
      placa, frota, tipo_veiculo: tipo, valor: parseFloat(valor) || 0,
      observacoes: obs, data_lavacao: dataLavacao, status: "PENDENTE",
    });
    if (error) { toast.error("ERRO AO CADASTRAR!"); return; }
    toast.success("VEÍCULO CADASTRADO!");
    setPlaca(""); setFrota(""); setValor(""); setObs("");
    carregar();
  }

  async function enviarParaLavacao() {
    if (selecionados.size === 0) { toast.error("SELECIONE OS VEÍCULOS!"); return; }
    const ids = Array.from(selecionados);
    for (const id of ids) {
      await supabase.from("lavacao").update({ enviado_lavacao: true, status: "EM LAVAÇÃO" } as any).eq("id", id);
    }
    toast.success(`${ids.length} VEÍCULO(S) ENVIADO(S) PARA LAVAÇÃO!`);
    setSelecionados(new Set());
    carregar();
  }

  function gerarPDF() {
    const enviados = registros.filter(r => selecionados.has(r.id) || r.enviado_lavacao);
    if (!enviados.length) { toast.error("NENHUM VEÍCULO SELECIONADO/ENVIADO!"); return; }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAVAÇÃO TL-BLU", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`DATA: ${filtroData}`, 105, 22, { align: "center" });

    autoTable(doc, {
      startY: 30,
      head: [["#", "PLACA", "FROTA", "TIPO", "VALOR", "STATUS"]],
      body: enviados.map((r, i) => [
        String(i + 1), r.placa, r.frota, r.tipo_veiculo,
        `R$ ${(r.valor || 0).toFixed(2)}`, r.status,
      ]),
      styles: { fontSize: 9, halign: "center" },
      headStyles: { fillColor: [0, 120, 200] },
    });

    doc.setFontSize(8);
    doc.text("GASPAR - SC | SISTEMA TL-BLU FROTA", 105, doc.internal.pageSize.height - 10, { align: "center" });
    doc.save(`LAVACAO_${filtroData}.pdf`);
    toast.success("PDF GERADO!");
  }

  function enviarWhatsApp() {
    const enviados = registros.filter(r => r.enviado_lavacao && r.status !== "CONCLUÍDO");
    if (!enviados.length) { toast.error("NENHUM VEÍCULO ENVIADO!"); return; }
    const contatosAtivos = contatos.filter(c => c.ativo);
    if (!contatosAtivos.length) { toast.error("NENHUM CONTATO CADASTRADO!"); return; }

    const msg = `🚿 *LAVAÇÃO TL-BLU - ${filtroData}*\n\n` +
      enviados.map((r, i) => `${i + 1}. *${r.placa}* | ${r.frota} | ${r.tipo_veiculo} | R$ ${r.valor.toFixed(2)}`).join("\n") +
      `\n\n📊 *TOTAL: ${enviados.length} VEÍCULO(S)*`;

    contatosAtivos.forEach(c => {
      const tel = c.telefone.replace(/\D/g, "");
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }

  async function excluir(id: string) {
    await supabase.from("lavacao").delete().eq("id", id);
    carregar();
    toast.success("REGISTRO EXCLUÍDO!");
  }

  async function salvarEdicao(id: string) {
    await supabase.from("lavacao").update(editData as any).eq("id", id);
    setEditId(null);
    carregar();
    toast.success("ATUALIZADO!");
  }

  async function addContato() {
    if (!contatoNome || !contatoTel) { toast.error("PREENCHA NOME E TELEFONE!"); return; }
    await supabase.from("lavacao_contatos").insert({ nome: contatoNome, telefone: contatoTel });
    setContatoNome(""); setContatoTel("");
    carregarContatos();
    toast.success("CONTATO ADICIONADO!");
  }

  async function excluirContato(id: string) {
    await supabase.from("lavacao_contatos").delete().eq("id", id);
    carregarContatos();
    toast.success("CONTATO REMOVIDO!");
  }

  function toggleSelecionado(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const naoEnviados = registros.filter(r => !r.enviado_lavacao);
  const totalHoje = registros.length;
  const totalConcluidos = registros.filter(r => r.status === "CONCLUÍDO").length;
  const totalEnviados = registros.filter(r => r.enviado_lavacao).length;
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
          { label: "ENVIADOS", value: totalEnviados, color: "text-orange-400" },
          { label: "VALOR TOTAL", value: `R$ ${totalValor.toFixed(2)}`, color: "text-primary" },
        ].map(c => (
          <div key={c.label} className="glass-card rounded-xl p-3 text-center border border-border/30">
            <div className={`font-orbitron text-lg font-bold ${c.color}`}>{c.value}</div>
            <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "cadastro", label: "CADASTRAR", icon: Plus },
          { key: "enviar", label: "ENVIAR P/ LAVAÇÃO", icon: Send },
          { key: "gestao", label: "GESTÃO", icon: Edit2 },
          { key: "contatos", label: "WHATSAPP", icon: Phone },
        ] as const).map(t => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)} className="uppercase font-orbitron text-xs gap-1">
            <t.icon className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {/* CADASTRO */}
      {tab === "cadastro" && (
        <div className="glass-card rounded-xl p-4 border border-border/30 space-y-3">
          <h2 className="font-orbitron text-sm text-primary uppercase">CADASTRAR VEÍCULO</h2>
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
            <Plus className="h-5 w-5" /> REGISTRAR VEÍCULO
          </Button>
        </div>
      )}

      {/* ENVIAR PARA LAVAÇÃO */}
      {tab === "enviar" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
              className="h-10 w-48 font-orbitron text-xs bg-input border-border" />
            <Button onClick={enviarParaLavacao} disabled={selecionados.size === 0}
              className="neon-button font-orbitron text-xs uppercase gap-1 h-10">
              <Send className="h-4 w-4" /> ENVIAR SELECIONADOS ({selecionados.size})
            </Button>
            <Button onClick={gerarPDF} className="neon-button-green font-orbitron text-xs uppercase gap-1 h-10">
              <FileText className="h-4 w-4" /> GERAR PDF
            </Button>
            <Button onClick={enviarWhatsApp} className="neon-button-green font-orbitron text-xs uppercase gap-1 h-10">
              <Phone className="h-4 w-4" /> WHATSAPP
            </Button>
          </div>

          <div className="space-y-2">
            {naoEnviados.length === 0 && (
              <div className="text-center text-muted-foreground text-xs font-orbitron p-6 uppercase">
                TODOS OS VEÍCULOS JÁ FORAM ENVIADOS OU NENHUM CADASTRADO
              </div>
            )}
            {naoEnviados.map(r => (
              <div key={r.id}
                onClick={() => toggleSelecionado(r.id)}
                className={`glass-card rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                  selecionados.has(r.id)
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                    : "border-border/30 hover:border-primary/30"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selecionados.has(r.id) ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {selecionados.has(r.id) && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <div>
                      <span className="font-orbitron text-sm text-primary font-bold">{r.placa}</span>
                      <span className="ml-3 font-orbitron text-xs text-muted-foreground">{r.frota}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-orbitron text-muted-foreground">
                    <span>{r.tipo_veiculo}</span>
                    <span className="text-primary font-bold">R$ {(r.valor || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Already sent */}
            {registros.filter(r => r.enviado_lavacao).length > 0 && (
              <>
                <h3 className="font-orbitron text-xs text-green-400 uppercase mt-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> JÁ ENVIADOS PARA LAVAÇÃO
                </h3>
                {registros.filter(r => r.enviado_lavacao).map(r => (
                  <div key={r.id} className="glass-card rounded-xl p-4 border border-green-400/30 opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-orbitron text-sm text-green-400 font-bold">{r.placa}</span>
                        <span className="ml-3 font-orbitron text-xs text-muted-foreground">{r.frota}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-orbitron">
                        <span className={`px-2 py-0.5 rounded text-[0.6rem] ${
                          r.status === "CONCLUÍDO" ? "bg-green-400/20 text-green-400" : "bg-orange-400/20 text-orange-400"
                        }`}>{r.status}</span>
                        {r.foto_lavado && <Camera className="h-4 w-4 text-green-400" />}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* GESTÃO */}
      {tab === "gestao" && (
        <div className="space-y-3">
          <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
            className="h-10 w-48 font-orbitron text-xs bg-input border-border" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-orbitron uppercase">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="p-2 text-left">PLACA</th>
                  <th className="p-2 text-left">FROTA</th>
                  <th className="p-2 text-left">TIPO</th>
                  <th className="p-2 text-right">VALOR</th>
                  <th className="p-2 text-center">STATUS</th>
                  <th className="p-2 text-center">FOTO</th>
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
                          <span className="text-[0.6rem]">{r.status}</span>
                        </td>
                        <td className="p-1 text-center">
                          {r.foto_lavado && <a href={r.foto_lavado} target="_blank" rel="noreferrer"><Camera className="h-4 w-4 text-green-400 mx-auto" /></a>}
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
                          <span className={`px-2 py-0.5 rounded text-[0.6rem] ${
                            r.status === "CONCLUÍDO" ? "bg-green-400/20 text-green-400" :
                            r.status === "EM LAVAÇÃO" ? "bg-primary/20 text-primary" :
                            "bg-orange-400/20 text-orange-400"
                          }`}>{r.status}</span>
                        </td>
                        <td className="p-2 text-center">
                          {r.foto_lavado && (
                            <a href={r.foto_lavado} target="_blank" rel="noreferrer">
                              <Camera className="h-4 w-4 text-green-400 mx-auto" />
                            </a>
                          )}
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
                  <tr><td colSpan={7} className="p-4 text-center text-muted-foreground text-xs">NENHUM REGISTRO</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTATOS */}
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

// ─── LAVADOR VIEW (user with pode_lavacao) ───
function LavadorView() {
  const [registros, setRegistros] = useState<LavacaoRecord[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoTarget, setFotoTarget] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const hoje = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase.from("lavacao").select("*")
      .eq("enviado_lavacao", true)
      .eq("data_lavacao", hoje)
      .order("created_at", { ascending: false });
    setRegistros((data as any[]) || []);
  }

  function iniciarFoto(id: string) {
    setFotoTarget(id);
    fileInputRef.current?.click();
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !fotoTarget) return;

    setUploading(fotoTarget);
    const fileName = `${fotoTarget}_${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("lavacao-fotos")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      toast.error("ERRO AO ENVIAR FOTO!");
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("lavacao-fotos").getPublicUrl(fileName);

    await supabase.from("lavacao").update({
      foto_lavado: urlData.publicUrl,
      status: "CONCLUÍDO",
    } as any).eq("id", fotoTarget);

    toast.success("FOTO SALVA! LAVAÇÃO CONCLUÍDA!");
    setUploading(null);
    setFotoTarget(null);
    e.target.value = "";
    carregar();
  }

  const pendentes = registros.filter(r => r.status !== "CONCLUÍDO");
  const concluidos = registros.filter(r => r.status === "CONCLUÍDO");

  return (
    <div className="space-y-4">
      <h1 className="font-orbitron text-xl text-primary neon-text uppercase tracking-wider flex items-center gap-2">
        <Car className="h-6 w-6" /> LAVAÇÃO - REGISTRAR
      </h1>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFoto} />

      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3 text-center border border-border/30">
          <div className="font-orbitron text-2xl font-bold text-orange-400">{pendentes.length}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">PENDENTES</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center border border-border/30">
          <div className="font-orbitron text-2xl font-bold text-green-400">{concluidos.length}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">CONCLUÍDOS</div>
        </div>
      </div>

      {/* Pending vehicles */}
      {pendentes.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-orbitron text-sm text-orange-400 uppercase">VEÍCULOS PARA LAVAR</h2>
          {pendentes.map(r => (
            <div key={r.id} className="glass-card rounded-xl p-4 border border-orange-400/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-orbitron text-lg text-primary font-bold">{r.placa}</div>
                  <div className="font-orbitron text-xs text-muted-foreground">{r.frota} • {r.tipo_veiculo}</div>
                </div>
                <span className="px-2 py-1 rounded bg-orange-400/20 text-orange-400 text-[0.6rem] font-orbitron uppercase">
                  {r.status}
                </span>
              </div>
              <Button
                onClick={() => iniciarFoto(r.id)}
                disabled={uploading === r.id}
                className="w-full h-14 neon-button-green font-orbitron uppercase text-sm gap-2">
                <Camera className="h-6 w-6" />
                {uploading === r.id ? "ENVIANDO FOTO..." : "BATER FOTO E CONCLUIR"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {concluidos.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-orbitron text-sm text-green-400 uppercase">✅ LAVADOS HOJE</h2>
          {concluidos.map(r => (
            <div key={r.id} className="glass-card rounded-xl p-4 border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-orbitron text-sm text-green-400 font-bold">{r.placa}</div>
                  <div className="font-orbitron text-xs text-muted-foreground">{r.frota} • {r.tipo_veiculo}</div>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              {r.foto_lavado && (
                <a href={r.foto_lavado} target="_blank" rel="noreferrer">
                  <img src={r.foto_lavado} alt={`Foto ${r.placa}`}
                    className="mt-2 rounded-lg w-full max-h-48 object-cover border border-green-400/20" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {registros.length === 0 && (
        <div className="text-center text-muted-foreground text-xs font-orbitron p-8 uppercase">
          NENHUM VEÍCULO ENVIADO PARA LAVAÇÃO HOJE
        </div>
      )}
    </div>
  );
}
