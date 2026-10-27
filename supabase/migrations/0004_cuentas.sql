-- =============================================================================
-- Comunidad INF · 0004_cuentas.sql
-- Cuentas de participante con correo y contraseña.
-- Ejecutar DESPUÉS de 0001-0003. No modifica tablas ni datos existentes:
-- solo agrega una función. Se puede ejecutar más de una vez.
--
-- Contexto: antes cada participante tenía una sesión anónima que vivía solo en
-- su navegador. Ahora se registra con correo y contraseña (Supabase Auth) y su
-- perfil sigue siendo participantes.id = auth.uid(), así que puede ingresar
-- desde cualquier dispositivo. Las sesiones anónimas antiguas se convierten en
-- cuenta desde la app conservando el mismo id (no hace falta migrar datos).
-- =============================================================================

-- Derecho de supresión (Ley N.° 29733): borra los datos propios por completo.
--   * Borra el perfil; por las claves foráneas (on delete cascade) se borran
--     también sus votos e inscripciones, y si era capitán el equipo queda sin capitán.
--   * Borra la cuenta de acceso (auth.users), para que su correo y contraseña
--     dejen de existir. Excepción: si es organizador, se conserva su cuenta para
--     no quitarle el acceso al panel por accidente; solo se borra su perfil.
create or replace function public.borrar_mi_cuenta()
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Necesitas ingresar a tu cuenta para borrar tus datos.';
  end if;

  delete from public.participantes where id = v_uid;

  if not public.es_organizador() then
    delete from auth.users where id = v_uid;
  end if;
end;
$$;

revoke execute on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
