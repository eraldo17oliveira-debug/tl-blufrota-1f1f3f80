CREATE TABLE public.portaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TEXT,
  hora_saida TEXT,
  hora_entrada TEXT,
  sentido TEXT,
  nome TEXT,
  cpf TEXT,
  placa_cavalo TEXT,
  placa_carreta TEXT,
  placa TEXT,
  origem TEXT,
  destino TEXT,
  smp TEXT,
  lacre TEXT,
  coleta TEXT,
  divergencia TEXT,
  veiculo_pedestre TEXT,
  empresa TEXT,
  pessoa_visitada TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portaria TO anon, authenticated;
GRANT ALL ON public.portaria TO service_role;

ALTER TABLE public.portaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to portaria" ON public.portaria FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_portaria_tipo_data ON public.portaria (tipo, data DESC);