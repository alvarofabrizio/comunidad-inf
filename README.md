# Comunidad INF

Aplicación web para que los estudiantes de Ingeniería Informática de la PUCP **voten qué actividades quieren**, **se inscriban aunque vengan solos** (individual, con equipo o en la bolsa de equipos) y **sumen puntos por asistir** en un ranking de temporada. Los organizadores (AAII o delegados) lo gestionan todo desde un panel.

Proyecto académico del curso **Ética y Responsabilidad Social Universitaria (PUCP, 2026-2)**. Uso académico y comunitario, no comercial.

- **Enlace público:** https://comunidad-inf.vercel.app
- **Equipo:** Carlos Monge, Alvaro Ferro, Mayerli López, Sebastián O'Brien y Bianca Pulido.

## Para quién

| Rol | Qué hace | Cuenta |
|---|---|---|
| Visitante | Ve el calendario, las actividades, la encuesta, el ranking y los resúmenes | No necesita |
| Participante | Vota, se inscribe (individual, crea un equipo, se une con un código o entra a la bolsa) y suma puntos | Cuenta con correo y contraseña: entra desde cualquier dispositivo con "Ingresar" |
| Organizador | Crea temporadas, actividades y encuestas; arma equipos desde la bolsa; marca asistencia; registra puestos; publica resúmenes; exporta CSV | Correo y contraseña |

## Probarlo en 5 minutos (escenario de prueba)

Usa **dos dispositivos**: un celular para el participante y otra computadora o una ventana privada para el organizador. Un navegador tiene una sesión a la vez; si se cambia de cuenta, se vuelve a entrar con **Ingresar** (correo y contraseña).

1. En el celular, abre https://comunidad-inf.vercel.app.
2. Toca **Crear cuenta**, completa nombre, alias, correo, contraseña y la casilla de consentimiento. Luego ve a **Encuesta** y vota (máximo 2 opciones por categoría).
3. Entra a **Torneo post-parciales** → **Busco equipo** → **Inscribirme y buscar equipo**.
4. En la otra computadora, el organizador entra por **Panel de organizadores** (pie de página) o https://comunidad-inf.vercel.app/org, abre el torneo, ve a la persona en la **Bolsa** y la asigna a un equipo.
5. El organizador marca la asistencia del equipo, le pone un puesto (1.°, 2.° o 3.°) y cambia el estado a **Finalizada**.
6. En el celular, abre **Ranking**: aparece el alias con sus puntos (5 por asistir + 10, 6 o 4 según el puesto).

**Usuario organizador de prueba:** `[CORREO]` / `[CONTRASEÑA]`

> No escribas la contraseña real en este archivo si el repositorio es público: cualquiera podría entrar al panel. Compártela por un canal privado con quien vaya a evaluar, o usa una cuenta de organizador solo para la demo y bórrala después.

Después de la demo, puedes devolver la actividad a "abierta" y borrar al participante de prueba desde su perfil (**Borrar mis datos**).

## Cómo funciona por dentro

```
Celular / navegador ──► React + Vite (SPA, desplegada en Vercel)
                              │  src/lib/api.ts (toda llamada a datos pasa por aquí)
                              ▼
                        Supabase: Auth (correo y contraseña) · PostgreSQL + RLS · Storage
```

- **Stack:** TypeScript, React 18, Vite, Tailwind CSS v4, React Router, supabase-js y Vitest.
- **Seguridad:** RLS (seguridad por filas) en las 11 tablas. Los datos públicos de personas salen solo por vistas que exponen el alias, nunca el correo. Las reglas (cupo, tamaño de equipo, voto único) las validan funciones de la base (`security definer`), no el navegador. Detalle en [docs/03_ARQUITECTURA.md](docs/03_ARQUITECTURA.md).
- **Regla de puntos:** está en [src/lib/puntos.ts](src/lib/puntos.ts) y en la vista SQL `vista_ranking_temporada`. Solo cuentan las actividades finalizadas y las personas con asistencia: puntos de participación más 1.° = 10, 2.° = 6 y 3.° = 4. En equipos, cada integrante recibe los puntos del equipo.

## Ejecutarlo en local

Requisitos: Node 20 o superior y un proyecto de Supabase configurado (ver la sección siguiente).

```bash
npm install
```

```bash
cp .env.example .env.local
```

Completa `.env.local` con la URL y la clave anónima o publicable de tu proyecto. **Nunca** uses la clave `service_role`.

```bash
npm run dev
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila para producción en `dist/` |
| `npm run test` | Pruebas de la regla de puntos y del CSV (Vitest) |
| `RANKING_EN_VIVO=1 npm run test` | Además compara el ranking de la base real con `puntos.ts` (solo coincide mientras la base tenga los datos semilla) |
| `node scripts/verificar_seguridad.mjs` | Intenta 26 ataques con la clave anónima (leer correos, votar dos veces, unirse a un equipo lleno, escribir en tablas de organizador). Todos deben quedar bloqueados |

## Configurar Supabase (una vez)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com), región South America (São Paulo).
2. **Authentication → Sign In / Providers:** activa **Email** y desactiva **Confirm email** (si no, cada registro envía un correo y el plan gratuito permite muy pocos por hora). Deja activado **Allow anonymous sign-ins**: lo usan los registros antiguos para convertirse en cuenta.
3. **Authentication → Rate Limits:** sube los límites de registros e inicios de sesión, porque en un laboratorio todos salen por la misma IP.
4. **SQL Editor:** ejecuta en este orden [0001_esquema.sql](supabase/migrations/0001_esquema.sql), [0002_rls_y_funciones.sql](supabase/migrations/0002_rls_y_funciones.sql), [0003_storage.sql](supabase/migrations/0003_storage.sql), [0004_cuentas.sql](supabase/migrations/0004_cuentas.sql) y [seed.sql](supabase/seed.sql). La 0004 solo agrega una función ("Borrar mis datos" también borra la cuenta) y no toca datos existentes. Los datos semilla son ficticios.
5. **Authentication → Users → Add user** (con "Auto confirm"). Copia su UID y ejecuta:
   ```sql
   insert into organizadores (user_id, nombre) values ('UID-DEL-USUARIO', 'Organizador AAII');
   ```
6. **Project Settings → API:** copia la Project URL y la clave anon/publishable a `.env.local` y a Vercel.
7. **Authentication → URL Configuration:** Site URL = `https://comunidad-inf.vercel.app`, y en **Redirect URLs** agrega `https://comunidad-inf.vercel.app/restablecer` y `http://localhost:5173/restablecer` (para "¿Olvidaste tu contraseña?"). El correo de recuperación usa el servicio gratuito de Supabase, que envía pocos correos por hora.

## Desplegar en Vercel

1. Importa el repositorio en Vercel. La configuración está en [vercel.json](vercel.json): reescritura de rutas de la SPA, caché de `/assets` y cabeceras de seguridad.
2. Agrega las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, con esos nombres exactos, para Production, Preview y Development.
3. Despliega. Si cambias las variables después, vuelve a desplegar: Vite las incluye al compilar.

Antes de una demo, abre el proyecto en Supabase para que no esté pausado.

## Estructura

```
supabase/migrations/   esquema, RLS y funciones, storage
supabase/seed.sql      datos semilla ficticios
src/lib/api.ts         capa de datos (única puerta a Supabase)
src/lib/puntos.ts      regla del ranking (con pruebas)
src/pages/             vistas públicas
src/pages/org/         panel del organizador
src/components/        interfaz (Pingüi, asientos de equipo, ClickSpark, PixelCard…)
tests/                 Vitest
scripts/               verificación de seguridad
docs/                  contexto, arquitectura, documento breve, declaración de IA y defensa
```

## Documentos

- [Documento breve del producto](docs/DOCUMENTO_BREVE_PRODUCTO.md)
- [Borrador de la declaración de uso de IA](docs/DECLARACION_USO_IA_BORRADOR.md) y [registro de uso de IA](IA_LOG.md)
- [Preguntas para la defensa](docs/PREGUNTAS_DEFENSA.md)

## Créditos

- Paleta y motivo pixelado inspirados en la identidad de la AAII (no se usa su logo).
- Pingüi: mascota original del proyecto, basada en el diseño del equipo e inspirada en Tux, la mascota de Linux.
- ClickSpark, PixelCard y CountUp: versiones propias, sin dependencias, inspiradas en componentes de [React Bits](https://reactbits.dev) (David Haz).
- Íconos: [Lucide](https://lucide.dev) (licencia ISC). Tipografía: DM Sans (Google Fonts, OFL).
- Desarrollo asistido por IA (Claude Code), declarado en [IA_LOG.md](IA_LOG.md).
