
CREATE TABLE public.whatsapp_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to whatsapp_contatos" ON public.whatsapp_contatos FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.whatsapp_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hora text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to whatsapp_horarios" ON public.whatsapp_horarios FOR ALL USING (true) WITH CHECK (true);
