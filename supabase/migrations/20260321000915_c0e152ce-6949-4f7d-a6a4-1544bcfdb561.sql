
CREATE TABLE public.servicos_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frota TEXT NOT NULL DEFAULT '',
  placa TEXT NOT NULL DEFAULT '',
  item_peca TEXT NOT NULL DEFAULT '',
  quantidade INTEGER NOT NULL DEFAULT 1,
  mecanico TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'AGUARDANDO PEÇA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos_internos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to servicos_internos" ON public.servicos_internos
  FOR ALL TO public USING (true) WITH CHECK (true);
