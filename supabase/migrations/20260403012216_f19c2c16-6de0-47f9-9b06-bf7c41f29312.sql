
CREATE OR REPLACE FUNCTION public.verify_login(p_login text, p_senha text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, nome, login, nivel, ativo,
         pode_patio, pode_rodizio, pode_combustivel, pode_inventario,
         pode_fornecedores, pode_expedicao, pode_pdf, pode_excel, pode_lavacao
  INTO v_user
  FROM public.profiles
  WHERE UPPER(login) = UPPER(p_login) AND ativo = true;

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', false, 'msg', 'USUÁRIO NÃO ENCONTRADO!');
  END IF;

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
    'pode_excel', v_user.pode_excel,
    'pode_lavacao', v_user.pode_lavacao
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_users_safe()
 RETURNS SETOF json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'id', id, 'nome', nome, 'login', login, 'nivel', nivel, 'ativo', ativo,
    'pode_patio', pode_patio, 'pode_rodizio', pode_rodizio,
    'pode_combustivel', pode_combustivel, 'pode_inventario', pode_inventario,
    'pode_fornecedores', pode_fornecedores, 'pode_expedicao', pode_expedicao,
    'pode_pdf', pode_pdf, 'pode_excel', pode_excel, 'pode_lavacao', pode_lavacao
  )
  FROM public.profiles
  ORDER BY created_at;
$function$;
