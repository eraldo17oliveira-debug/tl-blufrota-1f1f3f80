
-- Tabela de usuários do sistema (profiles)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL DEFAULT '',
  nivel TEXT NOT NULL DEFAULT 'MANOBRA' CHECK (nivel IN ('SUPERVISOR', 'MANOBRA', 'MANUTENCAO', 'EXPEDICAO')),
  pode_patio BOOLEAN NOT NULL DEFAULT false,
  pode_rodizio BOOLEAN NOT NULL DEFAULT false,
  pode_combustivel BOOLEAN NOT NULL DEFAULT false,
  pode_inventario BOOLEAN NOT NULL DEFAULT false,
  pode_fornecedores BOOLEAN NOT NULL DEFAULT false,
  pode_expedicao BOOLEAN NOT NULL DEFAULT false,
  pode_pdf BOOLEAN NOT NULL DEFAULT true,
  pode_excel BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pátio (logística)
CREATE TABLE public.patio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  frota TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  eixo TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de rodízio de pneus
CREATE TABLE public.rodizio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  frota TEXT NOT NULL DEFAULT '',
  posicao TEXT NOT NULL DEFAULT '',
  num_fogo TEXT NOT NULL DEFAULT '',
  lacre TEXT NOT NULL DEFAULT '',
  sulco TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'ENTRADA' CHECK (tipo IN ('ENTRADA', 'SAÍDA')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fechamento de combustível
CREATE TABLE public.combustivel_fechamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TEXT NOT NULL,
  leitura_inicial NUMERIC NOT NULL DEFAULT 0,
  leitura_final NUMERIC NOT NULL DEFAULT 0,
  consumo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de carga de combustível
CREATE TABLE public.combustivel_carga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  litros NUMERIC NOT NULL DEFAULT 0,
  fornecedor_id TEXT NOT NULL DEFAULT '',
  fornecedor_nome TEXT NOT NULL DEFAULT '',
  nota_fiscal TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inventário de pneus
CREATE TABLE public.pneu_inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  num_fogo TEXT NOT NULL DEFAULT '',
  tamanho TEXT NOT NULL DEFAULT '',
  largura TEXT NOT NULL DEFAULT '',
  aro TEXT NOT NULL DEFAULT '',
  marca TEXT NOT NULL DEFAULT '',
  fornecedor_id TEXT NOT NULL DEFAULT '',
  fornecedor_nome TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DISPONÍVEL' CHECK (status IN ('DISPONÍVEL', 'RECAPAGEM', 'SUCATA')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'COMBUSTÍVEL' CHECK (tipo IN ('COMBUSTÍVEL', 'PNEUS / RECAPAGEM', 'PEÇAS / MANUTENÇÃO')),
  telefone TEXT NOT NULL DEFAULT '',
  cidade_estado TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodizio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combustivel_fechamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combustivel_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pneu_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (o app gerencia o controle de acesso internamente)
CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to patio" ON public.patio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to rodizio" ON public.rodizio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to combustivel_fechamento" ON public.combustivel_fechamento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to combustivel_carga" ON public.combustivel_carga FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pneu_inventario" ON public.pneu_inventario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);

-- Inserir usuários padrão
INSERT INTO public.profiles (nome, login, senha, nivel, pode_patio, pode_rodizio, pode_combustivel, pode_inventario, pode_fornecedores, pode_expedicao, pode_pdf, pode_excel)
VALUES 
  ('ERALDO', 'ERALDO', '123', 'SUPERVISOR', true, true, true, true, true, true, true, true),
  ('EDUARDO', 'EDUARDO', '', 'MANOBRA', true, false, false, false, false, false, true, false),
  ('ANTONIO', 'ANTONIO', '', 'MANUTENCAO', false, true, false, true, false, false, true, false),
  ('CARLOS', 'CARLOS', '', 'EXPEDICAO', false, false, false, false, false, true, true, true);
