
-- Create a secure login function that never exposes passwords to the client
CREATE OR REPLACE FUNCTION public.verify_login(p_login TEXT, p_senha TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, nome, login, nivel, ativo,
         pode_patio, pode_rodizio, pode_combustivel, pode_inventario,
         pode_fornecedores, pode_expedicao, pode_pdf, pode_excel
  INTO v_user
  FROM public.profiles
  WHERE UPPER(login) = UPPER(p_login) AND ativo = true;

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', false, 'msg', 'USUÁRIO NÃO ENCONTRADO!');
  END IF;

  -- Check password
  IF (SELECT senha FROM public.profiles WHERE id = v_user.id) != p_senha AND
     (SELECT senha FROM public.profiles WHERE id = v_user.id) != '' THEN
    RETURN json_build_object('sucesso', false, 'msg', 'SENHA INCORRETA!');
  END IF;

  RETURN json_build_object(
    'sucesso', true,
    'id', v_user.id,
    'nome', v_user.nome,
    'nivel', v_user.nivel,
    'pode_patio', v_user.pode_patio,
    'pode_rodizio', v_user.pode_rodizio,
    'pode_combustivel', v_user.pode_combustivel,
    'pode_inventario', v_user.pode_inventario,
    'pode_fornecedores', v_user.pode_fornecedores,
    'pode_expedicao', v_user.pode_expedicao,
    'pode_pdf', v_user.pode_pdf,
    'pode_excel', v_user.pode_excel
  );
END;
$$;

-- Create a function to list users WITHOUT passwords
CREATE OR REPLACE FUNCTION public.list_users_safe()
RETURNS SETOF JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', id, 'nome', nome, 'login', login, 'nivel', nivel, 'ativo', ativo,
    'pode_patio', pode_patio, 'pode_rodizio', pode_rodizio,
    'pode_combustivel', pode_combustivel, 'pode_inventario', pode_inventario,
    'pode_fornecedores', pode_fornecedores, 'pode_expedicao', pode_expedicao,
    'pode_pdf', pode_pdf, 'pode_excel', pode_excel
  )
  FROM public.profiles
  ORDER BY created_at;
$$;
