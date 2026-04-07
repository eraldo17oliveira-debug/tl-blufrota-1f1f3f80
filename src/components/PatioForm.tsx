import { useState, useCallback } from "react";
import { salvarPatio, buscarUltimoPatio } from "@/lib/storage";
import { isPlacaValid } from "@/lib/placaMask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Truck, Container, MapPin, Lock, Axis3D, XCircle } from "lucide-react";
import OptionGroup from "./OptionGroup";
import PlacaInput from "./PlacaInput";
import { toast } from "sonner";

export default function PatioForm({ onSaved, onFechar }: { onSaved: () => void; onFechar: () => void }) {
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [modelo, setModelo] = useState("");
  const [eixo, setEixo] = useState("");
  const [estado, setEstado] = useState("");
  const [local, setLocal] = useState("");
  const [status, setStatus] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");

  const handlePlacaChange = useCallback(async (v: string) => {
    setPlaca(v);
    const clean = v.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length === 7 && isPlacaValid(v)) {
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
    toast.success("MOVIMENTAÇÃO REGISTRADA!");
    setPlaca(""); setFrota(""); setModelo(""); setEixo(""); setEstado(""); setLocal(""); setStatus(""); setMotivoBloqueio("");
    onSaved();
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlacaInput value={placa} onChange={setPlaca} />
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
        <Textarea
          placeholder="MOTIVO DO BLOQUEIO..."
          value={motivoBloqueio}
          onChange={e => setMotivoBloqueio(e.target.value)}
          className="uppercase font-orbitron text-xs bg-input border-destructive/50 focus:border-destructive min-h-[60px]"
        />
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
