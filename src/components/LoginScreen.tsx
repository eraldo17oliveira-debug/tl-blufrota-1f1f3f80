import { useState } from "react";
import { verificarLogin } from "@/lib/auth";
import { UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, KeyRound } from "lucide-react";

interface Props {
  onLogin: (session: UserSession) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    const result = verificarLogin(usuario, senha);
    if (result.sucesso && result.session) {
      onLogin(result.session);
    } else {
      setErro(result.msg || "Erro ao fazer login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">FROTA TL-BLU</CardTitle>
          <p className="text-sm text-muted-foreground">Acesso ao Pátio</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Usuário"
            value={usuario}
            onChange={e => { setUsuario(e.target.value); setErro(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="text-center uppercase"
          />
          <Input
            placeholder="Senha"
            type="password"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="text-center"
          />
          {erro && <p className="text-sm text-destructive text-center">{erro}</p>}
          <Button onClick={handleLogin} className="w-full gap-2">
            <KeyRound className="h-4 w-4" /> Entrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
