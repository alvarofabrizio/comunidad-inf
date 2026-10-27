-- =============================================================================
-- Comunidad INF · limpiar_cuentas.sql  (NO es una migración)
-- Deja en Supabase solo tu cuenta. Ejecutar por partes en el SQL Editor.
-- Antes de empezar, reemplaza TU-CORREO por el correo de tu cuenta de
-- organizador en las TRES apariciones (pasos 1, 2 y 3).
-- =============================================================================

-- PASO 1 · Revisar qué se va a borrar (no borra nada).
-- Muestra todas las cuentas menos la tuya, con su perfil si lo tienen.
select u.email,
       u.is_anonymous            as anonima,
       p.alias                   as perfil,
       (o.user_id is not null)   as organizador,
       u.created_at
  from auth.users u
  left join public.participantes p on p.id = u.id
  left join public.organizadores o on o.user_id = u.id
 where lower(coalesce(u.email, '')) <> lower('TU-CORREO')
 order by u.created_at;

-- Comprueba que tu cuenta sí existe (debe salir 1 fila con tu correo).
select id, email from auth.users where lower(email) = lower('TU-CORREO');


-- PASO 2 · Borrar todas las cuentas menos la tuya (nivel recomendado).
--   * Primero sus perfiles: por las claves foráneas se borran también sus votos
--     e inscripciones; si eran capitanes, el equipo queda sin capitán.
--   * Luego las cuentas de acceso. Si alguna era organizadora, pierde ese rol
--     (la fila de organizadores se borra en cascada).
--   * NO toca a los 12 participantes ficticios de la semilla: no son cuentas.
begin;
delete from public.participantes
 where id in (select id from auth.users where lower(coalesce(email, '')) <> lower('TU-CORREO'));
delete from auth.users
 where lower(coalesce(email, '')) <> lower('TU-CORREO');
commit;


-- PASO 3 (OPCIONAL) · Borrar también a los 12 participantes ficticios de la semilla.
-- Ojo: el ranking, la bolsa y los equipos quedarán vacíos y la encuesta en 0 votos.
-- Es reversible: volver a ejecutar supabase/seed.sql los restaura (usa "on conflict
-- do nothing", así que no duplica nada ni toca tu cuenta).
-- begin;
-- delete from public.participantes where id::text like 'e0000000-%';
-- commit;


-- PASO 4 · Verificar el resultado.
select (select count(*) from auth.users)            as cuentas,
       (select count(*) from public.organizadores)  as organizadores,
       (select count(*) from public.participantes)  as perfiles,
       (select count(distinct participante_id) from public.votos) as votantes;
