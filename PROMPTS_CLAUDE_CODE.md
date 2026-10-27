# Prompts para desarrollar Comunidad INF en Claude Code

## Antes de empezar

1. Crea la carpeta `comunidad-inf/` y copia ahí `CLAUDE.md`, la carpeta `docs/` (con los tres `.md`) y el informe `.docx` dentro de `docs/`.
2. Abre Claude Code en esa carpeta. Claude Code lee `CLAUDE.md` solo.
3. Completa las dos skills en el bloque de abajo y pégalo al inicio del **Prompt 0**.
4. Ejecuta los prompts en orden, uno por vez. Revisa el resultado de cada fase antes de pasar a la siguiente: el curso exige que puedan defender cada parte.
5. Ten listo el proyecto de Supabase (pasos en `docs/03_ARQUITECTURA.md`, sección "Configuración necesaria"). Claude Code te pedirá las claves en la Fase 1.

### Bloque de skills (completar)

```
Skills a usar en todo el proyecto:
- Skill 1: /____________________   → úsala para: ____________________
- Skill 2: /____________________   → úsala para: ____________________
Invoca cada skill antes de la fase en que aplica y sigue sus instrucciones.
```

---

## Prompt 0: comprensión y plan (en modo plan)

> Activa el modo plan (Shift+Tab hasta "plan mode") antes de enviarlo.

```
[PEGA AQUÍ EL BLOQUE DE SKILLS]

Vamos a construir "Comunidad INF", el producto informático del laboratorio de Ética y RSU.
Lee completos CLAUDE.md, docs/01_CONTEXTO_LABORATORIO.md, docs/02_CONTEXTO_PROBLEMATICA.md
y docs/03_ARQUITECTURA.md.

No escribas código todavía. Devuélveme:
1. Un resumen de 5 líneas del problema y de lo que hará el producto, para confirmar que lo entendiste.
2. El plan por fases (1 a 6, como en este archivo), con los archivos que crearás en cada una.
3. Las dudas o contradicciones que encuentres en la especificación. Si algo es ambiguo, propón
   la opción más simple y dime cuál elegiste.
4. Los pasos de configuración de Supabase que debo hacer yo, en orden.

El laboratorio es hoy: prioriza que el escenario de prueba (sección 7 de 02_CONTEXTO_PROBLEMATICA.md)
funcione de punta a punta antes que cualquier extra.
```

---

## Prompt 1: proyecto base y base de datos

```
Ejecuta la Fase 1.
- Crea el proyecto con Vite + React + TypeScript, Tailwind CSS, React Router, supabase-js y Vitest.
- Crea .env.example con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, y pídeme los valores
  para .env.local (no los subas a git; agrega .env.local a .gitignore).
- Escribe supabase/migrations/0001_esquema.sql con las tablas de docs/03_ARQUITECTURA.md,
  con claves foráneas, restricciones UNIQUE y CHECK para estados y tipos.
- Escribe supabase/migrations/0002_rls_y_funciones.sql con RLS en todas las tablas, las vistas
  públicas (participantes sin correo, ranking, resultados de encuesta) y las funciones
  SECURITY DEFINER: inscribirse, crear_equipo, unirse_equipo, asignar_a_equipo y votar.
  Cada función valida estado de la actividad, cupo, tamaño de equipo y voto único, y devuelve
  un mensaje de error claro en español.
- Escribe supabase/seed.sql con los datos semilla de la sección 8 (todos ficticios).
- Crea src/lib/supabase.ts, src/types.ts y src/lib/api.ts con funciones tipadas para cada operación.
- Explícame en un párrafo cómo funciona la RLS que escribiste y dime exactamente qué ejecutar
  en el SQL Editor de Supabase y en qué orden.
- Agrega la fila correspondiente a IA_LOG.md (créalo si no existe).
```

---

## Prompt 2: vistas públicas (P0)

```
Ejecuta la Fase 2: las vistas públicas P0 y el registro.
- Diseño mobile-first, en español, accesible (contraste AA, labels, foco visible), con una
  barra de navegación inferior en celular: Inicio, Calendario, Encuesta, Ranking.
- Registro: sesión anónima de Supabase + perfil con nombre, alias, correo, especialidad,
  código PUCP opcional y casilla obligatoria de consentimiento enlazada a /privacidad.
  Si el correo ya existe, muéstralo con un mensaje claro.
- Página /privacidad con qué datos se piden, para qué, quién los ve y cómo pedir su eliminación
  (Ley N.° 29733).
- Encuesta (P0-1): votar con el límite por categoría y ver resultados en barras con número y %.
- Actividad (P0-2): detalle e inscripción en sus tres modos (individual, crear equipo con código
  de invitación, "busco equipo"), unirse con código, pedir unirse a un equipo que busca
  integrantes y casilla del capitán para equipos mixtos. Muestra cupo y lugares libres.
- Bolsa de equipos por actividad: personas que buscan equipo (solo alias) y equipos con espacio.
- Ranking (P0-3): tabla por temporada con posición, alias, actividades asistidas y puntos.
- Cumple los criterios de aceptación de P0-1, P0-2 y P0-3. Muéstrame cómo los verificaste.
- Actualiza IA_LOG.md.
```

---

## Prompt 3: panel del organizador (P1-2)

```
Ejecuta la Fase 3: el panel del organizador en /org.
- Login con correo y contraseña. Solo entran usuarios registrados en la tabla organizadores;
  los demás ven "Acceso solo para organizadores".
- CRUD de temporadas, actividades y encuestas (con sus opciones por categoría).
- Gestión de una actividad: inscritos, equipos y bolsa en una sola pantalla; asignar personas
  de la bolsa a equipos; marcar asistencia; registrar posiciones 1.°, 2.° y 3.°; cambiar estado
  hasta "finalizada".
- Exportar inscritos a CSV (aquí sí puede ir el correo, porque solo lo ve el organizador).
- Protege las rutas /org en el frontend y confirma que la RLS también lo impide en la base.
- Actualiza IA_LOG.md.
```

---

## Prompt 4: ranking con pruebas, calendario y resúmenes (P1)

```
Ejecuta la Fase 4.
- Extrae la regla de puntos a src/lib/puntos.ts y escribe pruebas en tests/puntos.test.ts:
  solo participación, posición individual, posición por equipo repartida a cada miembro,
  persona sin asistencia (0 puntos) y empate de posiciones. Verifica que la vista SQL del ranking
  y esta función den el mismo resultado con los datos semilla.
- Calendario (P1-1): próximas y pasadas, etiquetas por tipo y botón Compartir que copia el enlace
  y abre WhatsApp con un texto prearmado.
- Resúmenes (P1-3): el organizador publica texto, ganadores e imagen opcional en Supabase Storage.
  Sin la casilla "Las personas que aparecen autorizaron su publicación", la imagen no se publica.
- Pie de página en todas las vistas con: "Proyecto académico, Ética y RSU, PUCP 2026-2" y los
  nombres del equipo: [INTEGRANTE 1], [INTEGRANTE 2], [INTEGRANTE 3], [INTEGRANTE 4], [INTEGRANTE 5].
- Actualiza IA_LOG.md.
```

---

## Prompt 5: verificación y despliegue

```
Ejecuta la Fase 5.
- Recorre el escenario de prueba de la sección 7 de 02_CONTEXTO_PROBLEMATICA.md paso a paso con
  los datos reales de Supabase y dime qué falló. Corrige y vuelve a recorrerlo hasta que pase
  completo.
- Revisa en 375 px de ancho que ninguna vista tenga scroll horizontal ni botones cortados.
- Revisa la seguridad: intenta, con la clave anónima, leer correos, votar dos veces, unirte a un
  equipo lleno y escribir en tablas de organizador. Todo debe fallar. Reporta el resultado.
- npm run build y npm run test sin errores.
- Prepara el despliegue en Vercel: vercel.json con la regla de rewrite para rutas de SPA e
  instrucciones de variables de entorno. Dime los pasos que debo hacer yo en Vercel.
- Actualiza IA_LOG.md.
```

---

## Prompt 6: documentación para la entrega

```
Ejecuta la Fase 6: documentación.
- README.md: qué es, para quién, cómo ejecutarlo en local, cómo configurar Supabase, enlace de
  despliegue ([URL]), usuario organizador de prueba ([CORREO] / [CONTRASEÑA]) y el escenario
  de prueba resumido.
- docs/DOCUMENTO_BREVE_PRODUCTO.md (máximo 2 páginas): problema, usuarios, funcionalidades,
  arquitectura en una línea y diagrama simple, cómo probarlo, consideraciones éticas
  (inclusión, datos personales, integración antes que recaudación, autoría) y limitaciones.
- Completa IA_LOG.md con todas las fases y genera docs/DECLARACION_USO_IA_BORRADOR.md a partir
  de él: herramientas usadas, para qué se usó en cada fase y qué partes revisó el equipo. Deja
  marcado [COMPLETAR POR EL EQUIPO] donde haga falta su revisión. No inventes revisiones humanas.
- Lista las 10 preguntas que probablemente haría la docente sobre el producto, con la respuesta
  breve y el archivo de código que la respalda, para preparar la defensa.
```

---

## Prompt de rescate (si algo se rompe)

```
Algo dejó de funcionar: [describe qué hiciste y qué viste, pega el error].
Antes de cambiar código, explica la causa probable y qué archivo la origina. Luego corrige con
el cambio mínimo, vuelve a correr build y tests, y dime cómo verificarlo.
```

## Recomendaciones de uso

- Si el tiempo aprieta, hagan las Fases 1, 2 y 5. Con eso el escenario de prueba funciona; el panel de la Fase 3 puede reducirse a asignar, asistencia y resultados.
- Hagan commit en git al terminar cada fase. Si una fase sale mal, pueden volver atrás.
- Pidan siempre la explicación de lo generado ("explícame este archivo como si lo fuera a defender"). La docente pidió que cada parte se pueda defender.
