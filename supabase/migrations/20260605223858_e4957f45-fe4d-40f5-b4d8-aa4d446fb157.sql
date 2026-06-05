CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('15','70')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  placa TEXT NOT NULL,
  frota TEXT,
  servicos TEXT,
  realizado_por TEXT,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  pago BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO anon, authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orcamentos_all" ON public.orcamentos FOR ALL USING (true) WITH CHECK (true);