import { useState, useCallback, useRef } from "react";
import { salvarPatio, buscarUltimoPatio } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { UserSession } from "@/lib/types";
import { isPlacaValid } from "@/lib/placaMask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Truck, Container, MapPin, Lock, Axis3D, XCircle, Camera, X } from "lucide-react";
import OptionGroup from "./OptionGroup";
import PlacaInput from "./PlacaInput";
import { toast } from "sonner";

export default function PatioForm({ session, onSaved, onFechar }: { session?: UserSession; onSaved: () => void; onFechar: () => void }) {
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [modelo, setModelo] = useState("");
  const [eixo, setEixo] = useState("");
  const [estado, setEstado] = useState("");
  const [local, setLocal] = useState("");
  const [status, setStatus] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFotoFile(f);
    const r = new FileReader();
    r.onload = () => setFotoPreview(r.result as string);
    r.readAsDataURL(f);
  };


  const handlePlacaChange = useCallback(async (v: string) => {
    setPlaca(v);
    const clean = v.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length === 7 && isPlacaValid(v)) {
      const placaUp = v.toUpperCase();
      const { data: alerta } = await supabase.from("placas_alerta" as any)
        .select("motivo, ativo").eq("placa", placaUp).eq("ativo", true).maybeSingle();
      if (alerta) {
        toast.warning(`⚠ PLACA EM ALERTA! ${(alerta as any).motivo || ""}`, {
          duration: 8000,
          style: { background: "hsl(48 100% 50%)", color: "#000", fontWeight: "bold" },
        });
      }

      // Verifica duplicidade no mesmo dia
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      const { data: hoje } = await supabase.from("patio").select("id")
        .eq("placa", placaUp).gte("created_at", startOfDay).lte("created_at", endOfDay).limit(1);
      if (hoje && hoje.length > 0) {
        toast.error("🚫 VEÍCULO JÁ CADASTRADO HOJE!", {
          duration: 6000,
          style: { background: "hsl(var(--destructive))", color: "#fff", fontWeight: "bold" },
        });
        return;
      }

      // Procura primeira entrada anterior para calcular dias na empresa
      const { data: primeiro } = await supabase.from("patio").select("created_at")
        .eq("placa", placaUp).lt("created_at", startOfDay)
        .order("created_at", { ascending: true }).limit(1);
      if (primeiro && primeiro.length > 0) {
        const dias = Math.floor((now.getTime() - new Date(primeiro[0].created_at).getTime()) / (1000 * 60 * 60 * 24));
        toast.info(`🔵 CARRETA HÁ ${dias} DIA${dias !== 1 ? "S" : ""} NA EMPRESA`, {
          duration: 8000,
          style: { background: "hsl(210 100% 50%)", color: "#fff", fontWeight: "bold" },
        });
      }

      const ultimo = await buscarUltimoPatio(v);
      if (ultimo) {
        setFrota(ultimo.frota || "");
        setModelo(ultimo.modelo || "");
        setEixo(ultimo.eixo || "");
        setEstado(ultimo.estado || "");
        setLocal(ultimo.local || "");
        toast.info("DADOS PRÉ-PREENCHIDOS DA ÚLTIMA ENTRADA!");
      }
    }
  }, []);

  const handleSave = async () => {
    if (!placa) { toast.error("INFORME A PLACA!"); return; }
    if (status === "Bloqueio" && !motivoBloqueio.trim()) { toast.error("INFORME O MOTIVO DO BLOQUEIO!"); return; }
    await salvarPatio({
      placa: placa.toUpperCase(), frota: frota.toUpperCase(), modelo, eixo, estado, local, status,
      motivo_bloqueio: status === "Bloqueio" ? motivoBloqueio.toUpperCase() : "",
    });

    // Se foi cadastrado como BLOQUEIO, registra também em "bloqueados" (se não houver ativo)
    if (status === "Bloqueio") {
      const placaUp = placa.toUpperCase();
      const { data: existente } = await supabase.from("bloqueados" as any)
        .select("id").eq("placa", placaUp).eq("status", "BLOQUEADO").limit(1);
      if (!existente || existente.length === 0) {
        let fotoUrl = "";
        if (fotoFile) {
          const fileName = `${Date.now()}_${placaUp.replace(/[^A-Z0-9]/gi, "")}.jpg`;
          const { error: upErr } = await supabase.storage.from("bloqueados-fotos").upload(fileName, fotoFile);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("bloqueados-fotos").getPublicUrl(fileName);
            fotoUrl = urlData.publicUrl;
          }
        }
        await supabase.from("bloqueados" as any).insert({
          placa: placaUp,
          frota: frota.toUpperCase(),
          modelo: (modelo || "").toUpperCase(),
          motivo: motivoBloqueio.toUpperCase(),
          foto: fotoUrl,
          responsavel: session?.nome || "SISTEMA",
          status: "BLOQUEADO",
        } as any);
        toast.warning("CARRETA REGISTRADA EM BLOQUEADOS — DESBLOQUEIE PARA REMOVER!");
      }
    }

    toast.success("MOVIMENTAÇÃO REGISTRADA!");
    setPlaca(""); setFrota(""); setModelo(""); setEixo(""); setEstado(""); setLocal(""); setStatus(""); setMotivoBloqueio("");
    setFotoFile(null); setFotoPreview("");
    onSaved();
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlacaInput value={placa} onChange={handlePlacaChange} />
        <Input placeholder="FROTA" value={frota} onChange={e => setFrota(e.target.value)}
          className="uppercase text-center font-orbitron font-semibold bg-input border-border/50 focus:border-primary h-12" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <OptionGroup label="MODELO" value={modelo} onChange={setModelo}
          colorClass="bg-primary text-primary-foreground" glowClass="neon-glow-primary"
          options={[
            { label: "CARRETA", value: "Carreta", icon: <Truck className="h-4 w-4" /> },
            { label: "BITREM", value: "Bitrem", icon: <Container className="h-4 w-4" /> },
          ]} />
        <OptionGroup label="EIXOS" value={eixo} onChange={setEixo}
          colorClass="bg-[hsl(var(--neon-purple))] text-primary-foreground" glowClass="shadow-[0_0_12px_hsl(var(--neon-purple)/0.5)]"
          options={[
            { label: "2 EIXOS", value: "2 Eixos", icon: <Axis3D className="h-4 w-4" /> },
            { label: "3 EIXOS", value: "3 Eixos", icon: <Axis3D className="h-4 w-4" /> },
          ]} />
        <OptionGroup label="CARGA" value={estado} onChange={setEstado}
          colorClass="bg-[hsl(var(--neon-orange))] text-primary-foreground" glowClass="shadow-[0_0_12px_hsl(var(--neon-orange)/0.5)]"
          options={[{ label: "VAZIA", value: "Vazia" }, { label: "CARGA", value: "Carga" }]} />
        <OptionGroup label="LOCAL" value={local} onChange={setLocal}
          colorClass="bg-accent text-accent-foreground" glowClass="neon-glow-green"
          options={[
            { label: "PÁTIO", value: "Pátio", icon: <MapPin className="h-4 w-4" /> },
            { label: "DOCA", value: "Doca", icon: <MapPin className="h-4 w-4" /> },
          ]} />
        <OptionGroup label="SEGURANÇA" value={status} onChange={(v) => { setStatus(v); if (v !== "Bloqueio") setMotivoBloqueio(""); }}
          colorClass="bg-destructive text-destructive-foreground" glowClass="shadow-[0_0_12px_hsl(var(--destructive)/0.5)]"
          options={[
            { label: "LIVRE", value: "Livre" },
            { label: "BLOQUEIO", value: "Bloqueio", icon: <Lock className="h-4 w-4" /> },
          ]} />
      </div>

      {status === "Bloqueio" && (
        <div className="space-y-3">
          <Textarea
            placeholder="MOTIVO DO BLOQUEIO..."
            value={motivoBloqueio}
            onChange={e => setMotivoBloqueio(e.target.value)}
            className="uppercase font-orbitron text-xs bg-input border-destructive/50 focus:border-destructive min-h-[60px]"
          />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
          {fotoPreview ? (
            <div className="relative">
              <img src={fotoPreview} alt="prévia" className="w-full max-h-56 object-contain rounded-lg border border-destructive/30" />
              <Button type="button" size="icon" variant="ghost"
                onClick={() => { setFotoFile(null); setFotoPreview(""); }}
                className="absolute top-1 right-1 h-7 w-7 bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={() => cameraRef.current?.click()} variant="outline"
              className="w-full h-12 font-orbitron uppercase text-xs gap-2 border-destructive/40 text-destructive">
              <Camera className="h-4 w-4" /> TIRAR FOTO DO BLOQUEIO
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1 gap-2 bg-accent hover:bg-accent/80 text-accent-foreground font-orbitron font-bold text-sm h-14 rounded-xl neon-glow-green transition-all duration-300">
          <CheckCircle2 className="h-5 w-5" /> REGISTRAR ✅
        </Button>
        <Button onClick={onFechar} variant="outline" className="gap-2 font-orbitron font-bold text-sm h-14 rounded-xl border-primary/50 text-primary hover:bg-primary/10 px-6">
          <XCircle className="h-5 w-5" /> FECHAR CADASTRO
        </Button>
      </div>
    </div>
  );
}
