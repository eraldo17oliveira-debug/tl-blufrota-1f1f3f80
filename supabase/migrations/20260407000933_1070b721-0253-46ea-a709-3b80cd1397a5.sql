
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.limpar_registros_antigos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.patio WHERE created_at < (now() - interval '1 month');
  DELETE FROM public.lavacao WHERE created_at < (now() - interval '1 month');
END;
$$;

SELECT cron.schedule(
  'limpar-registros-mensais',
  '0 3 * * *',
  $$SELECT public.limpar_registros_antigos()$$
);
