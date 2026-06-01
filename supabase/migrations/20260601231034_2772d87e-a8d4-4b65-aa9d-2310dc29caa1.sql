
CREATE TABLE public.calibragem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  frota TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  responsavel TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calibragem TO anon, authenticated;
GRANT ALL ON public.calibragem TO service_role;

ALTER TABLE public.calibragem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to calibragem"
ON public.calibragem
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_calibragem_placa ON public.calibragem(placa);
CREATE INDEX idx_calibragem_created_at ON public.calibragem(created_at DESC);
