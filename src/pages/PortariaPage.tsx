import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Trash2, Plus, FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type Campo = { key: string; label: string; tipo?: "texto" | "hora" | "data" | "select"; opcoes?: string[] };

const ABAS: { id: string; titulo: string; campos: Campo[] }[] = [
  {
    id: "VIAGEM",
    titulo: "VIAGEM",
    campos: [
      { key: "data", label: "DATA", tipo: "data" },
      { key: "hora", label: "HORA", tipo: "hora" },
      { key: "sentido", label: "ENTRADA / SAÍDA", tipo: "select", opcoes: ["ENTRADA", "SAÍDA"] },
      { key: "nome", label: "NOME" },
      { key: "cpf", label: "CPF" },
      { key: "placa_cavalo", label: "PLACA CAVALO" },
      { key: "placa_carreta", label: "PLACA CARRETA" },
      { key: "origem", label: "ORIGEM" },
      { key: "destino", label: "DESTINO" },
      { key: "smp", label: "SMP OU AE" },
      { key: "lacre", label: "LACRE" },
      { key: "divergencia", label: "DIVERGÊNCIA (TABELA)" },
      { key: "observacao", label: "OBSERVAÇÃO" },
    ],
  },
  {
    id: "COLETA_ENTREGA",
    titulo: "COLETA / ENTREGA",
    campos: [
      { key: "data", label: "DATA", tipo: "data" },
      { key: "hora_saida", label: "HORA SAÍDA", tipo: "hora" },
      { key: "hora_entrada", label: "HORA ENTRADA", tipo: "hora" },
      { key: "nome", label: "NOME" },
      { key: "cpf", label: "CPF" },
      { key: "coleta", label: "COLETA" },
      { key: "placa_cavalo", label: "PLACA CAVALO" },
      { key: "placa_carreta", label: "PLACA CARRETA" },
      { key: "smp", label: "SMP" },
      { key: "lacre", label: "LACRE" },
      { key: "observacao", label: "OBSERVAÇÃO" },
    ],
  },
  {
    id: "PRESTADOR",
    titulo: "PRESTADOR DE SERVIÇO",
    campos: [
      { key: "data", label: "DATA", tipo: "data" },
      { key: "hora", label: "HORA", tipo: "hora" },
      { key: "sentido", label: "ENTRADA / SAÍDA", tipo: "select", opcoes: ["ENTRADA", "SAÍDA"] },
      { key: "veiculo_pedestre", label: "VEÍCULO / PEDESTRE", tipo: "select", opcoes: ["VEÍCULO", "PEDESTRE"] },
      { key: "placa", label: "PLACA" },
      { key: "nome", label: "NOME" },
      { key: "cpf", label: "CPF" },
      { key: "empresa", label: "EMPRESA" },
      { key: "pessoa_visitada", label: "PESSOA VISITADA" },
      { key: "observacao", label: "OBSERVAÇÃO" },
    ],
  },
  {
    id: "VISITANTE",
    titulo: "VISITANTE",
    campos: [
      { key: "data", label: "DATA", tipo: "data" },
      { key: "hora", label: "HORA", tipo: "hora" },
      { key: "sentido", label: "ENTRADA / SAÍDA", tipo: "select", opcoes: ["ENTRADA", "SAÍDA"] },
      { key: "veiculo_pedestre", label: "VEÍCULO / PEDESTRE", tipo: "select", opcoes: ["VEÍCULO", "PEDESTRE"] },
      { key: "placa", label: "PLACA" },
      { key: "nome", label: "NOME" },
      { key: "cpf", label: "CPF" },
      { key: "empresa", label: "EMPRESA" },
      { key: "pessoa_visitada", label: "PESSOA VISITADA" },
      { key: "observacao", label: "OBSERVAÇÃO" },
    ],
  },
];

const hojeISO = () => new Date().toISOString().slice(0, 10);
const agoraHora = () => new Date().toTimeString().slice(0, 5);

function novoForm(aba: typeof ABAS[number]) {
  const f: Record<string, string> = {};
  aba.campos.forEach(c => {
    f[c.key] = c.tipo === "data" ? hojeISO() : c.tipo === "hora" ? agoraHora() : "";
  });
  return f;
}

function SubModulo({ aba }: { aba: typeof ABAS[number] }) {
  const [form, setForm] = useState<Record<string, string>>(() => novoForm(aba));
  const [lista, setLista] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const { data } = await supabase
      .from("portaria" as any)
      .select("*")
      .eq("tipo", aba.id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    setLista((data as any) || []);
  };

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [aba.id]);

  const salvar = async () => {
    if (!form.nome?.trim()) { toast.error("INFORME O NOME!"); return; }
    setSalvando(true);
    const payload: Record<string, any> = { tipo: aba.id };
    aba.campos.forEach(c => {
      const v = (form[c.key] || "").trim();
      payload[c.key] = c.tipo === "data" || c.tipo === "hora" ? v || null : v.toUpperCase() || null;
    });
    const { error } = await supabase.from("portaria" as any).insert(payload as any);
    setSalvando(false);
    if (error) { toast.error("ERRO AO SALVAR!"); return; }
    toast.success("REGISTRO SALVO!");
    setForm(novoForm(aba));
    carregar();
  };

  const remover = async (id: string) => {
    await supabase.from("portaria" as any).delete().eq("id", id);
    toast.success("REGISTRO EXCLUÍDO!");
    carregar();
  };

  const filtrada = useMemo(() => {
    const q = busca.toUpperCase().trim();
    if (!q) return lista;
    return lista.filter(r => aba.campos.some(c => String(r[c.key] || "").toUpperCase().includes(q)));
  }, [lista, busca, aba]);

  const exportarExcel = () => {
    if (!filtrada.length) { toast.error("NADA PARA EXPORTAR!"); return; }
    const linhas = filtrada.map(r => {
      const o: Record<string, any> = {};
      aba.campos.forEach(c => {
        o[c.label] = c.tipo === "data" && r[c.key]
          ? String(r[c.key]).split("-").reverse().join("/")
          : r[c.key] || "";
      });
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, aba.titulo.slice(0, 30));
    XLSX.writeFile(wb, `PORTARIA_${aba.id}_${hojeISO()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-primary/25">
        <h2 className="font-orbitron text-xs font-bold uppercase tracking-widest text-primary">
          NOVO REGISTRO — {aba.titulo}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {aba.campos.map(c => (
            <div key={c.key} className="space-y-1">
              <label className="font-orbitron text-[0.6rem] uppercase tracking-wider text-muted-foreground">{c.label}</label>
              {c.tipo === "select" ? (
                <select
                  value={form[c.key] || ""}
                  onChange={e => setForm({ ...form, [c.key]: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-3 h-10 text-xs font-orbitron uppercase"
                >
                  <option value="">—</option>
                  {c.opcoes!.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input
                  type={c.tipo === "data" ? "date" : c.tipo === "hora" ? "time" : "text"}
                  value={form[c.key] || ""}
                  onChange={e => setForm({ ...form, [c.key]: c.tipo ? e.target.value : e.target.value.toUpperCase() })}
                  className="font-orbitron text-xs uppercase h-10"
                />
              )}
            </div>
          ))}
        </div>
        <Button onClick={salvar} disabled={salvando} className="w-full font-orbitron text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4 mr-2" /> {salvando ? "SALVANDO..." : "REGISTRAR"}
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3 border border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="BUSCA RÁPIDA..."
              className="pl-9 font-orbitron text-xs uppercase h-9"
            />
          </div>
          <Button onClick={exportarExcel} variant="outline" className="font-orbitron text-[0.6rem] uppercase h-9">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> EXPORTAR PLANILHA
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {aba.campos.map(c => (
                  <TableHead key={c.key} className="font-orbitron text-[0.55rem] uppercase whitespace-nowrap">{c.label}</TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrada.map(r => (
                <TableRow key={r.id}>
                  {aba.campos.map(c => (
                    <TableCell key={c.key} className="text-[0.65rem] font-orbitron uppercase whitespace-nowrap">
                      {c.tipo === "data" && r[c.key]
                        ? String(r[c.key]).split("-").reverse().join("/")
                        : r[c.key] || "—"}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remover(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtrada.length && (
                <TableRow>
                  <TableCell colSpan={aba.campos.length + 1} className="text-center text-[0.65rem] font-orbitron uppercase text-muted-foreground py-6">
                    NENHUM REGISTRO
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function PortariaPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-orbitron text-lg font-bold uppercase flex items-center gap-2 text-primary neon-text">
        <ShieldCheck className="h-5 w-5" /> PORTARIA
      </h1>

      <Tabs defaultValue={ABAS[0].id}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-transparent">
          {ABAS.map(a => (
            <TabsTrigger key={a.id} value={a.id} className="font-orbitron text-[0.55rem] uppercase tracking-wider py-2">
              {a.titulo}
            </TabsTrigger>
          ))}
        </TabsList>
        {ABAS.map(a => (
          <TabsContent key={a.id} value={a.id} className="mt-4">
            <SubModulo aba={a} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
