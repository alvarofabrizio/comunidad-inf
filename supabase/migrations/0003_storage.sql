-- =============================================================================
-- Comunidad INF · 0003_storage.sql
-- Bucket "resumenes" para las fotos de los resúmenes de actividad (P1-3).
-- Ejecutar DESPUÉS de 0002 (usa public.es_organizador()).
--
-- Reglas:
--   * Cualquiera puede VER las fotos (el bucket es público: los resúmenes son públicos).
--   * Solo los organizadores pueden SUBIR, reemplazar o borrar fotos.
--   * Solo imágenes JPG, PNG o WebP de hasta 5 MB.
--   * La autorización de las personas que aparecen se exige en la tabla resumenes:
--     CHECK (imagen_url is null or imagen_autorizada) de 0001_esquema.sql. Sin la
--     casilla marcada, la base no acepta la URL de la imagen.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumenes', 'resumenes', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists resumenes_fotos_lectura on storage.objects;
drop policy if exists resumenes_fotos_alta on storage.objects;
drop policy if exists resumenes_fotos_edicion on storage.objects;
drop policy if exists resumenes_fotos_baja on storage.objects;

create policy resumenes_fotos_lectura on storage.objects
  for select to anon, authenticated using (bucket_id = 'resumenes');

create policy resumenes_fotos_alta on storage.objects
  for insert to authenticated with check (bucket_id = 'resumenes' and public.es_organizador());

create policy resumenes_fotos_edicion on storage.objects
  for update to authenticated using (bucket_id = 'resumenes' and public.es_organizador())
  with check (bucket_id = 'resumenes' and public.es_organizador());

create policy resumenes_fotos_baja on storage.objects
  for delete to authenticated using (bucket_id = 'resumenes' and public.es_organizador());
