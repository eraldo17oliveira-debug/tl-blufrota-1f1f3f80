
-- Add columns to lavacao table for the new flow
ALTER TABLE public.lavacao ADD COLUMN IF NOT EXISTS enviado_lavacao boolean NOT NULL DEFAULT false;
ALTER TABLE public.lavacao ADD COLUMN IF NOT EXISTS foto_lavado text NOT NULL DEFAULT '';

-- Create storage bucket for washing photos
INSERT INTO storage.buckets (id, name, public) VALUES ('lavacao-fotos', 'lavacao-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public read lavacao-fotos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lavacao-fotos');

-- Allow authenticated insert to the bucket  
CREATE POLICY "Allow upload lavacao-fotos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'lavacao-fotos');

-- Allow delete
CREATE POLICY "Allow delete lavacao-fotos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'lavacao-fotos');
