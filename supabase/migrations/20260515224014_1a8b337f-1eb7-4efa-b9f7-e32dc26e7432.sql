CREATE TABLE public.placas_alerta (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa text NOT NULL,
  motivo text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.placas_alerta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to placas_alerta" ON public.placas_alerta FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_placas_alerta_placa ON public.placas_alerta (placa);