# Arquitectura de Comunidad INF

## Decisión

Aplicación web de una sola página (SPA) con un backend gestionado. No hay servidor propio que mantener.

| Capa | Tecnología | Por qué |
|---|---|---|
| Lenguaje | TypeScript | Tipos en el modelo de datos; menos errores al conectar vistas y base de datos |
| Interfaz | React 18 + Vite | Lo que Claude Code genera con más soltura; arranque y compilación rápidos |
| Estilos | Tailwind CSS | Diseño responsive sin escribir CSS a mano; consistente |
| Navegación | React Router | Rutas públicas y de organizador |
| Backend | Supabase (PostgreSQL + Auth + Storage) | Base de datos compartida real, plan gratuito, seguridad por filas (RLS) y SDK en JavaScript |
| Autenticación | Supabase Auth: sesión anónima para participantes, correo y contraseña para organizadores | Participar sin contraseña y, aun así, que cada quien solo pueda modificar lo suyo |
| Imágenes | Supabase Storage (bucket `resumenes`) | Fotos de resúmenes con autorización |
| Pruebas | Vitest (lógica de puntos y reglas de equipos) | La regla del ranking es lo que más hay que defender |
| Despliegue | Vercel (o Netlify) desde GitHub | Enlace público en minutos |

### Alternativas descartadas

| Opción | Por qué no |
|---|---|
| HTML y JavaScript con `localStorage` | Cada navegador tiene sus propios datos: el organizador no vería a quien se inscribió en otro celular. No cumple "probado por otra persona" con datos reales |
| Next.js con servidor | Más piezas (renderizado en servidor, rutas API) sin beneficio para este alcance |
| Node + Express + SQLite | Hay que alojar y mantener un servidor; los planes gratuitos se duermen y la base puede perderse |
| Firebase | Viable, pero las reglas de Firestore son más difíciles de explicar que SQL y el ranking es una consulta relacional |

## Diagrama

```
 Celular / navegador
 ┌──────────────────────────────┐
 │  React + Vite (SPA)          │
 │  Vistas públicas | Panel org │
 │  capa de datos: src/lib/api  │
 └──────────────┬───────────────┘
                │ supabase-js (HTTPS)
 ┌──────────────▼───────────────┐
 │ Supabase                     │
 │  Auth (anónimo / correo)     │
 │  PostgreSQL + RLS            │
 │   tablas, vistas, funciones  │
 │  Storage (imágenes)          │
 └──────────────────────────────┘
 Despliegue del frontend: Vercel
```

## Modelo de datos

```
temporadas(id, nombre, fecha_inicio, fecha_fin, activa)
participantes(id = auth.uid, nombre, alias UNIQUE, correo UNIQUE, codigo_pucp NULL,
              especialidad, consentimiento BOOL, consentimiento_en TIMESTAMPTZ, creado_en)
organizadores(user_id = auth.uid, nombre)
actividades(id, temporada_id, titulo, tipo, juego_o_disciplina, descripcion, fecha_hora,
            lugar, modalidad, cupo, tamano_equipo, requiere_mixto BOOL,
            puntos_participacion, puntos_1, puntos_2, puntos_3, estado, creado_en)
equipos(id, actividad_id, nombre, codigo_invitacion UNIQUE, capitan_id,
        declara_cumple_mixto BOOL, buscando_integrantes BOOL)
inscripciones(id, actividad_id, participante_id, equipo_id NULL, en_bolsa BOOL,
              asistio BOOL, UNIQUE(actividad_id, participante_id))
resultados(id, actividad_id, equipo_id NULL, participante_id NULL, posicion)
encuestas(id, temporada_id, titulo, max_votos_por_categoria, abierta BOOL, cierra_en)
opciones_encuesta(id, encuesta_id, categoria, texto)
votos(id, encuesta_id, opcion_id, participante_id, UNIQUE(opcion_id, participante_id))
resumenes(id, actividad_id UNIQUE, texto, imagen_url NULL, imagen_autorizada BOOL, publicado_en)
```

Vistas y funciones:

- `vista_participantes_publica`: solo `id` y `alias` (nunca correo ni nombre completo).
- `vista_ranking_temporada`: puntos por participante y temporada, según la regla de `02_CONTEXTO_PROBLEMATICA.md` (P0-3).
- `vista_resultados_encuesta`: votos por opción y total de votantes.
- Funciones `SECURITY DEFINER` para operaciones que deben validar reglas de forma atómica: `inscribirse(actividad, modo)`, `crear_equipo(actividad, nombre)`, `unirse_equipo(codigo)`, `asignar_a_equipo(inscripcion, equipo)` (solo organizador) y `votar(encuesta, opciones[])`. Validan cupo, tamaño de equipo, estado de la actividad y voto único.

## Seguridad (RLS)

- Lectura pública: temporadas, actividades no borrador, equipos (sin datos personales), vistas públicas, resúmenes publicados.
- Participante (sesión anónima o con correo): crea y edita **solo su** perfil; sus inscripciones y votos pasan por las funciones.
- Organizador (existe en `organizadores`): escritura completa en actividades, encuestas, resultados, asistencia y resúmenes; lectura de correos para exportar CSV.
- La clave `service_role` nunca va al frontend. Solo se usan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Estructura del repositorio

```
comunidad-inf/
├── CLAUDE.md
├── README.md
├── IA_LOG.md
├── docs/
│   ├── 01_CONTEXTO_LABORATORIO.md
│   ├── 02_CONTEXTO_PROBLEMATICA.md
│   ├── 03_ARQUITECTURA.md
│   ├── Informe_Exploracion_Lab_RSU.docx
│   └── DOCUMENTO_BREVE_PRODUCTO.md      (se genera al final)
├── supabase/
│   ├── migrations/0001_esquema.sql
│   ├── migrations/0002_rls_y_funciones.sql
│   └── seed.sql
├── src/
│   ├── lib/supabase.ts        cliente
│   ├── lib/api.ts             toda llamada a datos pasa por aquí
│   ├── lib/puntos.ts          regla del ranking (con pruebas)
│   ├── types.ts
│   ├── components/
│   ├── pages/                 Inicio, Calendario, Actividad, Bolsa, Encuesta,
│   │                          Ranking, Resumenes, Privacidad, Registro
│   └── pages/org/             Login, Panel, EditorActividad, GestionActividad,
│                              EditorEncuesta, EditorResumen
├── tests/puntos.test.ts
├── .env.example
└── package.json
```

## Configuración necesaria (la hace el equipo, no la IA)

1. Crear un proyecto gratuito en supabase.com.
2. En Authentication, activar "Anonymous sign-ins" y el proveedor de correo.
3. Ejecutar en el SQL Editor las migraciones y el `seed.sql`, en ese orden.
4. Crear el usuario organizador en Authentication e insertar su `user_id` en `organizadores`.
5. Copiar la URL y la clave anónima a `.env.local` (y a las variables de entorno de Vercel).
6. Conectar el repositorio de GitHub a Vercel y desplegar.

## Riesgos técnicos conocidos

- La sesión anónima vive en el navegador: si el participante cambia de dispositivo o borra datos, pierde acceso a su perfil. Para la demo es aceptable; queda como mejora futura (enlace mágico por correo).
- Plan gratuito de Supabase: el proyecto se pausa tras días sin uso. Abrirlo antes de la demo.
