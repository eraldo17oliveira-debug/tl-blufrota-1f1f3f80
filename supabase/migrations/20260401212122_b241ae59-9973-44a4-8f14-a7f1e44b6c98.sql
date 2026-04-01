ALTER TABLE public.servicos_internos ADD COLUMN numero_os SERIAL;
ALTER TABLE public.servicos_internos ADD COLUMN tipo_servico TEXT NOT NULL DEFAULT '';
ALTER TABLE public.servicos_internos ADD COLUMN local_servico TEXT NOT NULL DEFAULT '';