import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ban, Camera, CheckCircle2, Trash2, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BloqueadoRecord {
  id: string;
  placa: string;
  frota: string;
  modelo: string;
  motivo: string;
  foto: string;
  responsavel: string;
  status: string;
  data_bloqueio: string;
  data_desbloqueio: string | null;
  observacoes_desbloqueio: string;
}

export default function BloqueadosPage({ session }: { session: UserSession }) {
  const [registros, setRegistros] = useState<BloqueadoRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [modelo, setModelo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fotoBase64, setFotoBase64] = useState<string>("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [desbloqueioId, setDesbloqueioId] = useState<string | null>(null);
  const [obsDesbloqueio, setObsDesbloqueio] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<"BLOQUEADO" | "DESBLOQUEADO" | "TODOS">("BLOQUEADO");
  const [busca, setBusca] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data, error } = await supabase.from("bloqueados" as any).select("*")
      .order("data_bloqueio", { ascending: false });
    if (error) { console.error(error); return; }
    setRegistros((data as any[]) || []);
  }

  useEffect(() => { carregar(); }, []);

  async function handlePlacaChange(v: string) {
    setPlaca(v.toUpperCase());
    const clean = v.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length === 7) {
      // tenta puxar do pátio
      const { data } = await supabase.from("patio").select("frota,modelo")
        .ilike("placa", `%${clean.slice(0,3)}%${clean.slice(3)}%`)
        .order("created_at", { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setFrota(data[0].frota || "");
        setModelo(data[0].modelo || "");
        toast.info("DADOS PRÉ-PREENCHIDOS!");
      }
    }
  }

  function abrirCamera() {
    cameraInputRef.current?.click();
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setPlaca(""); setFrota(""); setModelo(""); setMotivo("");
    setFotoBase64(""); setFotoFile(null);
  }

  async function salvarBloqueio() {
    if (!placa.trim()) { toast.error("INFORME A PLACA!"); return; }
    if (!motivo.trim()) { toast.error("INFORME O MOTIVO!"); return; }
    setSalvando(true);

    let fotoUrl = "";
    if (fotoFile) {
      const fileName = `${Date.now()}_${placa.replace(/[^A-Z0-9]/gi, "")}.jpg`;
      const { error: upErr } = await supabase.storage.from("bloqueados-fotos").upload(fileName, fotoFile);
      if (upErr) {
        console.error(upErr);
        toast.error("ERRO AO ENVIAR FOTO");
        setSalvando(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("bloqueados-fotos").getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("bloqueados" as any).insert({
      placa: placa.toUpperCase().trim(),
      frota: frota.toUpperCase().trim(),
      modelo: modelo.toUpperCase().trim(),
      motivo: motivo.toUpperCase().trim(),
      foto: fotoUrl,
      responsavel: session.nome,
      status: "BLOQUEADO",
    } as any);

    setSalvando(false);
    if (error) { console.error(error); toast.error("ERRO AO SALVAR"); return; }

    toast.success("CARRETA BLOQUEADA!");
    setModalOpen(false);
    resetForm();
    carregar();
  }

  async function confirmarDesbloqueio() {
    if (!desbloqueioId) return;
    const { error } = await supabase.from("bloqueados" as any).update({
      status: "DESBLOQUEADO",
      data_desbloqueio: new Date().toISOString(),
      observacoes_desbloqueio: obsDesbloqueio.toUpperCase().trim(),
    } as any).eq("id", desbloqueioId);
    if (error) { console.error(error); toast.error("ERRO!"); return; }
    toast.success("DESBLOQUEADO!");
    setDesbloqueioId(null); setObsDesbloqueio("");
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("EXCLUIR ESTE REGISTRO?")) return;
    await supabase.from("bloqueados" as any).delete().eq("id", id);
    toast.success("REMOVIDO!");
    carregar();
  }

  const filtrados = registros.filter(r => {
    if (filtroStatus !== "TODOS" && r.status !== filtroStatus) return false;
    if (busca && !r.placa.includes(busca.toUpperCase()) && !r.frota.includes(busca.toUpperCase())) return false;
    return true;
  });

  const totalBloqueados = registros.filter(r => r.status === "BLOQUEADO").length;
  const totalDesbloqueados = registros.filter(r => r.status === "DESBLOQUEADO").length;

  return (
    <div className="space-y-4">
      <h1 className="font-orbitron text-xl text-destructive uppercase tracking-wider flex items-center gap-2">
        <Ban className="h-6 w-6" /> CARRETAS BLOQUEADAS
      </h1>

      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3 text-center border border-destructive/40">
          <div className="font-orbitron text-2xl font-bold text-destructive">{totalBloqueados}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">BLOQUEADAS</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center border border-accent/40">
          <div className="font-orbitron text-2xl font-bold text-accent">{totalDesbloqueados}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">DESBLOQUEADAS</div>
        </div>
      </div>

      {/* Ações */}
      <Button onClick={() => setModalOpen(true)}
        className="w-full h-14 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-orbitron uppercase text-sm gap-2 rounded-xl">
        <Plus className="h-5 w-5" /> NOVO BLOQUEIO
      </Button>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["BLOQUEADO", "DESBLOQUEADO", "TODOS"] as const).map(s => (
          <Button key={s} size="sm"
            variant={filtroStatus === s ? "default" : "outline"}
            onClick={() => setFiltroStatus(s)}
            className="font-orbitron text-xs uppercase">
            {s}
          </Button>
        ))}
        <div className="flex-1 min-w-[150px] relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="BUSCAR PLACA/FROTA"
            value={busca} onChange={e => setBusca(e.target.value.toUpperCase())}
            className="pl-8 h-9 font-orbitron text-xs uppercase" />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.length === 0 && (
          <div className="text-center text-muted-foreground text-xs font-orbitron p-6 uppercase">
            NENHUM REGISTRO
          </div>
        )}
        {filtrados.map(r => (
          <div key={r.id} className={`glass-card rounded-xl p-3 border ${
            r.status === "BLOQUEADO" ? "border-destructive/40" : "border-accent/30 opacity-70"
          }`}>
            <div className="flex gap-3">
              {r.foto ? (
                <img src={r.foto} alt={r.placa}
                  className="w-20 h-20 object-cover rounded-lg border border-border/30 cursor-pointer"
                  onClick={() => window.open(r.foto, "_blank")} />
              ) : (
                <div className="w-20 h-20 rounded-lg border border-border/30 flex items-center justify-center bg-muted/20">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className={`font-orbitron text-base font-bold ${
                    r.status === "BLOQUEADO" ? "text-destructive" : "text-accent"
                  }`}>{r.placa}</span>
                  <span className={`px-2 py-0.5 rounded text-[0.6rem] font-orbitron uppercase ${
                    r.status === "BLOQUEADO" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"
                  }`}>{r.status}</span>
                </div>
                <div className="text-[0.65rem] font-orbitron text-muted-foreground uppercase mt-1">
                  {r.frota} {r.modelo && `• ${r.modelo}`}
                </div>
                <div className="text-[0.7rem] font-orbitron text-foreground mt-1 line-clamp-2">
                  ⚠ {r.motivo}
                </div>
                <div className="text-[0.55rem] font-orbitron text-muted-foreground uppercase mt-1">
                  POR: {r.responsavel} • {format(new Date(r.data_bloqueio), "dd/MM/yyyy HH:mm")}
                </div>
                {r.status === "DESBLOQUEADO" && r.data_desbloqueio && (
                  <div className="text-[0.55rem] font-orbitron text-accent uppercase mt-1">
                    DESBLOQUEADO: {format(new Date(r.data_desbloqueio), "dd/MM/yyyy HH:mm")}
                    {r.observacoes_desbloqueio && ` • ${r.observacoes_desbloqueio}`}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {r.status === "BLOQUEADO" && (
                    <Button size="sm" onClick={() => setDesbloqueioId(r.id)}
                      className="h-7 text-[0.6rem] font-orbitron bg-accent hover:bg-accent/80 text-accent-foreground uppercase gap-1">
                      <CheckCircle2 className="h-3 w-3" /> DESBLOQUEAR
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => excluir(r.id)}
                    className="h-7 text-[0.6rem] text-destructive uppercase gap-1">
                    <Trash2 className="h-3 w-3" /> EXCLUIR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Bloqueio */}
      <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="glass-card border-destructive/40 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-destructive text-sm uppercase flex items-center gap-2">
              <Ban className="h-4 w-4" /> NOVO BLOQUEIO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="PLACA" value={placa}
              onChange={e => handlePlacaChange(e.target.value)}
              className="h-12 uppercase font-orbitron text-lg tracking-widest text-center bg-input border-border" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="FROTA" value={frota}
                onChange={e => setFrota(e.target.value.toUpperCase())}
                className="h-12 uppercase font-orbitron bg-input border-border" />
              <Input placeholder="MODELO" value={modelo}
                onChange={e => setModelo(e.target.value.toUpperCase())}
                className="h-12 uppercase font-orbitron bg-input border-border" />
            </div>
            <Textarea placeholder="MOTIVO DO BLOQUEIO" value={motivo}
              onChange={e => setMotivo(e.target.value.toUpperCase())}
              className="uppercase font-orbitron bg-input border-border min-h-[80px]" />

            {/* Câmera */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleFoto} className="hidden" />

            {fotoBase64 ? (
              <div className="relative">
                <img src={fotoBase64} alt="prévia"
                  className="w-full max-h-64 object-contain rounded-lg border border-border/30" />
                <Button size="icon" variant="ghost"
                  onClick={() => { setFotoBase64(""); setFotoFile(null); }}
                  className="absolute top-1 right-1 h-7 w-7 bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={abrirCamera} variant="outline"
                className="w-full h-14 font-orbitron uppercase text-xs gap-2 border-primary/40">
                <Camera className="h-5 w-5" /> TIRAR FOTO DO BLOQUEIO
              </Button>
            )}

            <Button onClick={salvarBloqueio} disabled={salvando}
              className="w-full h-14 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-orbitron uppercase text-sm gap-2">
              <Ban className="h-5 w-5" /> {salvando ? "SALVANDO..." : "REGISTRAR BLOQUEIO"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Desbloqueio */}
      <Dialog open={!!desbloqueioId} onOpenChange={(o) => { if (!o) { setDesbloqueioId(null); setObsDesbloqueio(""); } }}>
        <DialogContent className="glass-card border-accent/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-accent text-sm uppercase flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> CONFIRMAR DESBLOQUEIO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea placeholder="OBSERVAÇÕES (OPCIONAL)" value={obsDesbloqueio}
              onChange={e => setObsDesbloqueio(e.target.value.toUpperCase())}
              className="uppercase font-orbitron bg-input border-border" />
            <Button onClick={confirmarDesbloqueio}
              className="w-full h-12 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron uppercase text-sm gap-2">
              <CheckCircle2 className="h-4 w-4" /> CONFIRMAR DESBLOQUEIO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
