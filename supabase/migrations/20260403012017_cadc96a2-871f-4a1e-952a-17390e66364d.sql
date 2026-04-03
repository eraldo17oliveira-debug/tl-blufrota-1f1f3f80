
CREATE TABLE public.lavacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL DEFAULT '',
  frota TEXT NOT NULL DEFAULT '',
  tipo_veiculo TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  data_lavacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lavacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lavacao" ON public.lavacao FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.lavacao_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lavacao_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lavacao_contatos" ON public.lavacao_contatos FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pode_lavacao BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles SET pode_lavacao = true WHERE nivel = 'SUPERVISOR';
