import { useState } from "react";
import { salvarDados } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, Container, MapPin, Lock, Axis3D } from "lucide-react";
import OptionGroup from "./OptionGroup";
import { toast } from "sonner";

export default function VehicleForm({ onSaved }: { onSaved: () => void }) {
  const [placa, setPlaca] = useState("");
  const [frota, setFrota] = useState("");
  const [modelo, setModelo] = useState("");
  const [eixo, setEixo] = useState("");
  const [estado, setEstado] = useState("");
  const [local, setLocal] = useState("");
  const [status, setStatus] = useState("");

  const handleSave = () => {
    if (!placa) { toast.error("Informe a placa!"); return; }
    salvarDados({ placa: placa.toUpperCase(), frota: frota.toUpperCase(), modelo, eixo, estado, local, status });
    toast.success("Movimentação registrada!");
    setPlaca(""); setFrota(""); setModelo(""); setEixo(""); setEstado(""); setLocal(""); setStatus("");
    onSaved();
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input placeholder="Placa" value={placa} onChange={e => setPlaca(e.target.value)} className="uppercase text-center font-semibold" />
          <Input placeholder="Frota" value={frota} onChange={e => setFrota(e.target.value)} className="uppercase text-center font-semibold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <OptionGroup label="Modelo" value={modelo} onChange={setModelo} colorClass="bg-info text-info-foreground"
            options={[{ label: "Carreta", value: "Carreta", icon: <Truck className="h-3.5 w-3.5" /> }, { label: "Bitrem", value: "Bitrem", icon: <Container className="h-3.5 w-3.5" /> }]} />
          <OptionGroup label="Eixos" value={eixo} onChange={setEixo} colorClass="bg-primary text-primary-foreground"
            options={[{ label: "2 Eixos", value: "2 Eixos", icon: <Axis3D className="h-3.5 w-3.5" /> }, { label: "3 Eixos", value: "3 Eixos", icon: <Axis3D className="h-3.5 w-3.5" /> }]} />
          <OptionGroup label="Carga" value={estado} onChange={setEstado} colorClass="bg-warning text-warning-foreground"
            options={[{ label: "Vazia", value: "Vazia" }, { label: "Carga", value: "Carga" }]} />
          <OptionGroup label="Local" value={local} onChange={setLocal} colorClass="bg-accent text-accent-foreground"
            options={[{ label: "Pátio", value: "Pátio", icon: <MapPin className="h-3.5 w-3.5" /> }, { label: "Doca", value: "Doca", icon: <MapPin className="h-3.5 w-3.5" /> }]} />
          <OptionGroup label="Segurança" value={status} onChange={setStatus} colorClass="bg-destructive text-destructive-foreground"
            options={[{ label: "Livre", value: "Livre" }, { label: "Bloqueio", value: "Bloqueio", icon: <Lock className="h-3.5 w-3.5" /> }]} />
        </div>

        <Button onClick={handleSave} className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm h-12">
          <CheckCircle2 className="h-4 w-4" /> Registrar Movimentação
        </Button>
      </CardContent>
    </Card>
  );
}
