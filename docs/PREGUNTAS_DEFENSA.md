# Preguntas probables de la docente (preparación de la defensa)

Cada respuesta es breve e indica dónde está el código que la respalda, para abrirlo en vivo si lo piden. Todos los integrantes deberían poder responder cualquiera.

### 1. ¿Qué problema resuelve y por qué es un problema real de la especialidad?
Los estudiantes participan poco: se elige qué hacer sin preguntar, los avisos están dispersos y llegan tarde, y quien no tiene grupo se queda fuera. Lo vimos en el torneo de ajedrez sin asistentes presenciales, en el requisito de equipos mixtos que no se cubrió y en la jornada deportiva sin difusión. La app ataca cada causa: encuesta (qué quiere la mayoría), calendario y Compartir (difusión), temporada y ranking (continuidad) y bolsa de equipos (barreras).
**Respaldo:** `docs/02_CONTEXTO_PROBLEMATICA.md` (tabla de causas), `src/pages/Encuesta.tsx`, `src/pages/Calendario.tsx`, `src/pages/Bolsa.tsx`.

### 2. ¿Cómo se calculan los puntos del ranking?
Solo cuentan las actividades **finalizadas** y las personas con **asistencia marcada**. Puntos = participación (5) más el puesto (1.° = 10, 2.° = 6, 3.° = 4, configurables). En equipos, cada integrante recibe los puntos completos de su equipo; en los empates, ambos reciben los puntos del puesto. La misma regla está en SQL y en TypeScript, y una prueba comprueba que coinciden.
**Respaldo:** `src/lib/puntos.ts`, vista `vista_ranking_temporada` en `supabase/migrations/0002_rls_y_funciones.sql`, `tests/puntos.test.ts`, `tests/ranking_vs_vista.test.ts`.

### 3. ¿Qué impide que alguien vea los correos de otros?
La seguridad por filas (RLS) de PostgreSQL: la tabla `participantes` solo deja leer la fila propia o, si eres organizador, todas. Lo público (ranking, bolsa, equipos) sale de vistas que solo exponen el **alias**. Aunque alguien modifique la app en su navegador, la base no le entrega correos. Lo probamos con un script de ataques.
**Respaldo:** políticas `participantes_*` y vistas `vista_*` en `0002_rls_y_funciones.sql`; `scripts/verificar_seguridad.mjs`.

### 4. ¿Cómo evitan que alguien vote dos veces o se pase del cupo?
La validación no está en el navegador sino en funciones de la base (`votar`, `inscribirse`, `_agregar_a_equipo`). Esas funciones bloquean la fila de la actividad (`for update`) o usan un candado por persona, así que dos clics simultáneos no pueden saltarse la regla. Un segundo voto devuelve "Ya votaste en esta encuesta"; un equipo lleno devuelve "ya tiene 5 de 5 integrantes".
**Respaldo:** funciones `votar`, `inscribirse` y `_agregar_a_equipo` en `0002_rls_y_funciones.sql`.

### 5. ¿Cómo funcionan las cuentas? ¿Puedo entrar desde otro celular?
Sí. Cada participante crea una cuenta con correo y contraseña (Supabase Auth guarda la contraseña cifrada) y su perfil queda ligado al id de esa cuenta: `participantes.id = auth.uid()`. Con **Ingresar** entra desde cualquier dispositivo, y la RLS solo le deja modificar lo suyo. Al principio usábamos sesiones anónimas (el perfil vivía en un navegador); los registros antiguos se convierten en cuenta con "Protege tu cuenta" sin perder nada, porque Supabase conserva el mismo id. No hizo falta migrar datos.
**Respaldo:** `registrarParticipante`, `iniciarSesion` y `protegerCuenta` en `src/lib/api.ts`; `src/pages/Registro.tsx`, `src/pages/Ingresar.tsx`; política `participantes_propio_alta`.

### 6. Si una actividad exige equipo mixto, ¿cómo lo controlan sin preguntar el género?
No lo preguntamos ni lo guardamos: es un dato sensible y no es necesario. El capitán marca una casilla declarando que su equipo cumple la regla, y el organizador la ve en el panel. Es una decisión ética consciente: preferimos confiar en una declaración antes que crear una base de datos de género.
**Respaldo:** columna `declara_cumple_mixto` en `0001_esquema.sql`, `actualizar_mi_equipo` en `0002_rls_y_funciones.sql`, `src/pages/Actividad.tsx`.

### 7. ¿Cómo cumplen la Ley N.° 29733 de protección de datos personales?
Se piden los datos mínimos, con un consentimiento obligatorio enlazado a la página de privacidad, que explica qué datos se piden, para qué, quién los ve y cómo borrarlos. Cualquier persona puede **borrar sus datos** desde su perfil. Las fotos de los resúmenes solo se publican si el organizador declara que las personas que aparecen lo autorizaron, y la base lo exige con una restricción.
**Respaldo:** `src/pages/Privacidad.tsx`, "Borrar mis datos" en `src/pages/Registro.tsx`, `check (imagen_url is null or imagen_autorizada)` en `0001_esquema.sql`, `src/pages/org/EditorResumen.tsx`.

### 8. ¿Qué parte hizo la IA y qué parte hicieron ustedes?
La IA (Claude Code) escribió la mayor parte del código y de la documentación, y lo declaramos fase por fase. El equipo definió el problema y la especificación, configuró Supabase y Vercel, hizo las pruebas como organizador, eligió la identidad visual y a Pingüi, y [COMPLETAR POR EL EQUIPO: qué revisó y explica cada integrante].
**Respaldo:** `IA_LOG.md`, `docs/DECLARACION_USO_IA_BORRADOR.md`.

### 9. ¿Por qué eligieron React + Supabase y no algo más simple, como HTML con localStorage?
Con localStorage cada celular tendría sus propios datos: el organizador no vería a quien se inscribió desde otro teléfono, y el producto no se podría probar "por otra persona" con datos reales. Supabase ofrece una base de datos compartida gratuita con seguridad por filas, sin un servidor propio que mantener. React con Vite nos da una aplicación rápida en el celular.
**Respaldo:** `docs/03_ARQUITECTURA.md` (alternativas descartadas), `src/lib/supabase.ts`, `vercel.json`.

### 10. ¿Qué limitaciones tiene y qué harían después?
Un navegador tiene una sesión a la vez y la recuperación de contraseña depende del correo gratuito de Supabase (pocos envíos por hora); no hay notificaciones ni integración con Paideia; el plan gratuito pausa el proyecto y limita los registros por IP. Después agregaríamos un contador regresivo por actividad, "Agregar a mi calendario", modo oscuro y la final de fin de ciclo con los mejores del ranking. También haríamos una encuesta real para medir la participación antes y después.
**Respaldo:** sección 7 de `docs/DOCUMENTO_BREVE_PRODUCTO.md`.

---

**Preguntas de respaldo, por si piden más detalle técnico**
- *¿Cómo protegen el panel?* En el frontend con `src/components/RutaOrganizador.tsx`, pero la protección real es la función `es_organizador()` dentro de las políticas RLS.
- *¿El CSV es seguro?* Incluye correos porque solo lo descarga el organizador. Además, neutraliza las "fórmulas" de Excel en los alias: `src/lib/csv.ts` y `tests/csv.test.ts`.
- *¿Funciona en el celular?* Se diseñó primero para el celular, con barra inferior y botones de al menos 44 px. Revisamos 20 vistas a 375 px sin desbordes: registro en `IA_LOG.md`.
