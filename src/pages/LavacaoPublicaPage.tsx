import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, CheckCircle2, Droplets, Car } from "lucide-react";
import { format } from "date-fns";

interface LavacaoRecord {
  id: string;
  placa: string;
  frota: string;
  tipo_veiculo: string;
  status: string;
  foto_lavado: string;
  enviado_lavacao: boolean;
}

export default function LavacaoPublicaPage() {
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
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <h1 className="font-orbitron text-xl text-primary neon-text uppercase tracking-wider flex items-center gap-2 mb-4">
        <Droplets className="h-6 w-6" /> LAVAÇÃO TL-BLU
      </h1>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFoto} />

      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card rounded-xl p-3 text-center border border-border/30">
          <div className="font-orbitron text-2xl font-bold text-orange-400">{pendentes.length}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">PARA LAVAR</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center border border-border/30">
          <div className="font-orbitron text-2xl font-bold text-accent">{concluidos.length}</div>
          <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase">LAVADOS</div>
        </div>
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="space-y-2 mb-4">
          <h2 className="font-orbitron text-sm text-orange-400 uppercase flex items-center gap-2">
            <Car className="h-4 w-4" /> VEÍCULOS PARA LAVAR
          </h2>
          {pendentes.map(r => (
            <div key={r.id} className="glass-card rounded-xl p-4 border border-orange-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-orbitron text-lg text-primary font-bold">{r.placa}</div>
                  <div className="font-orbitron text-xs text-muted-foreground">{r.frota} • {r.tipo_veiculo}</div>
                </div>
                <Button
                  onClick={() => iniciarFoto(r.id)}
                  disabled={uploading === r.id}
                  className="h-14 px-5 neon-button-green font-orbitron uppercase text-sm gap-2">
                  <Camera className="h-5 w-5" />
                  {uploading === r.id ? "ENVIANDO..." : "LAVADO ✅"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-orbitron text-sm text-accent uppercase flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> LAVADOS HOJE
          </h2>
          {concluidos.map(r => (
            <div key={r.id} className="glass-card rounded-xl p-4 border border-accent/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-orbitron text-sm text-accent font-bold">{r.placa}</div>
                  <div className="font-orbitron text-xs text-muted-foreground">{r.frota} • {r.tipo_veiculo}</div>
                </div>
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              {r.foto_lavado && (
                <a href={r.foto_lavado} target="_blank" rel="noreferrer">
                  <img src={r.foto_lavado} alt={`Foto ${r.placa}`}
                    className="mt-2 rounded-lg w-full max-h-48 object-cover border border-accent/20" />
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
