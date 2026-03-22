import { useState } from "react";
import { verificarLogin } from "@/lib/auth";
import { UserSession } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, KeyRound, Loader2 } from "lucide-react";

interface Props { onLogin: (session: UserSession) => void; }

export default function LoginScreen({ onLogin }: Props) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const result = await verificarLogin(usuario, senha);
    setLoading(false);
    if (result.sucesso && result.session) onLogin(result.session);
    else setErro(result.msg || "ERRO AO FAZER LOGIN");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(220 30% 10%), hsl(220 20% 2%))" }}>
      <div className="glass-card-glow w-full max-w-sm rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 neon-glow-primary neon-pulse">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-orbitron text-xl font-bold text-primary neon-text uppercase tracking-widest">TL-BLU FROTA</h1>
          <p className="text-sm text-muted-foreground uppercase font-orbitron text-[0.6rem] tracking-wider">ACESSO AO SISTEMA 🚚</p>
        </div>
        <div className="space-y-4">
          <Input placeholder="USUÁRIO" value={usuario}
            onChange={e => { setUsuario(e.target.value); setErro(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="text-center uppercase bg-input border-border focus:border-primary font-orbitron text-sm h-14" />
          <Input placeholder="SENHA" type="password" value={senha}
            onChange={e => { setSenha(e.target.value); setErro(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="text-center bg-input border-border focus:border-primary h-14" />
          {erro && <p className="text-sm text-destructive text-center uppercase font-orbitron text-[0.65rem]">{erro}</p>}
          <Button onClick={handleLogin} disabled={loading} className="w-full gap-2 h-14 font-orbitron font-bold bg-primary text-primary-foreground hover:bg-primary/80 neon-glow-primary neon-pulse transition-all duration-300 uppercase">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} ENTRAR 🔑
          </Button>
        </div>
      </div>
    </div>
  );
}
