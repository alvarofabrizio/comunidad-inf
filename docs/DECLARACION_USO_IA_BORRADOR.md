# Declaración de uso de inteligencia artificial (borrador)

**Producto:** Comunidad INF, https://comunidad-inf.vercel.app
**Curso:** Ética y Responsabilidad Social Universitaria, PUCP 2026-2
**Equipo:** Carlos Monge, Alvaro Ferro, Mayerli López, Sebastián O'Brien y Bianca Pulido
**Fuente:** este borrador se armó a partir de [IA_LOG.md](../IA_LOG.md), el registro que se llenó durante el desarrollo.

> Este documento es un borrador. Las partes marcadas **[COMPLETAR POR EL EQUIPO]** solo las puede llenar el equipo: describen revisiones y decisiones humanas que la IA no puede afirmar. No se debe entregar con esas marcas.

## 1. Herramientas usadas

| Herramienta | Para qué |
|---|---|
| **Claude Code** (modelo Claude Opus 5.5, app de escritorio de Claude) | Planificar, escribir el código (frontend, SQL, pruebas, scripts), probar en el navegador integrado, redactar la documentación |
| Skills de diseño dentro de Claude Code: *ui-ux-pro-max*, *design-taste-frontend*, *impeccable* | Sistema de diseño, accesibilidad (contraste AA), revisión visual automatizada y piso de calidad de la interfaz |
| [React Bits](https://reactbits.dev) (biblioteca de componentes, como referencia) | Inspiración para CountUp, ClickSpark y PixelCard, reescritos sin dependencias |
| [COMPLETAR POR EL EQUIPO: otras herramientas de IA usadas fuera de Claude Code, por ejemplo para el informe de exploración, el afiche o el video, o "ninguna"] | |

## 2. Para qué se usó en cada fase

| Fase | Qué hizo la IA | Qué hizo el equipo (registrado) |
|---|---|---|
| 0. Plan | Leyó la especificación, propuso el plan por fases, listó 19 ambigüedades con la opción más simple y los pasos de Supabase | Escribió la especificación (`CLAUDE.md`, `docs/01-03`, `PROMPTS_CLAUDE_CODE.md`) y aprobó el plan |
| 1. Base de datos | Generó el proyecto, el esquema SQL, la seguridad por filas, las funciones con reglas (cupo, equipos, voto único), los datos semilla ficticios, la capa de datos y las pruebas de la regla de puntos; validó el SQL en un PostgreSQL local | Creó el proyecto de Supabase, entregó la URL y la clave pública, y ejecutó las migraciones |
| 2. Vistas públicas | Generó el registro sin contraseña, la privacidad, la encuesta, la actividad con sus 3 modos de inscripción, la bolsa y el ranking; aplicó las skills de diseño | Confirmó el contexto de producto (`PRODUCT.md`) y activó el registro anónimo en Supabase |
| 3. Panel del organizador | Generó el login, la protección de `/org`, los CRUD, la gestión de la actividad, el CSV y el script de seguridad (14 ataques bloqueados) | Creó el usuario organizador e inició sesión para las pruebas |
| 4. Ranking, calendario y resúmenes | Comparó el ranking SQL con `puntos.ts` (coinciden), hizo el calendario con Compartir por WhatsApp, los resúmenes con foto y autorización obligatoria, y el pie | Ejecutó `0003_storage.sql` |
| Prueba del escenario | Recorrió los 6 pasos con datos reales, corrigió 2 detalles y limpió los datos de prueba | Autorizó usar su sesión de organizador y pidió la limpieza |
| 5. Verificación y despliegue | Amplió la prueba de seguridad (26 ataques bloqueados), revisó 23 vistas a 375 px, corrigió un desborde en el inicio, creó `vercel.json` y diagnosticó la página en blanco por variables mal nombradas | Creó el repositorio en GitHub, desplegó en Vercel y corrigió las variables de entorno |
| Identidad visual | Rediseñó la paleta en verde, creó el logo, dibujó a Pingüi en dos variantes e integró los componentes inspirados en React Bits | Entregó el afiche y el logo de la AAII como referencia de color, el diseño de Pingüi y los nombres del equipo |
| 6. Documentación | Redactó el README, el documento breve, este borrador y las preguntas de defensa, usando también la propuesta de Sebastián | [COMPLETAR POR EL EQUIPO] |

## 3. Qué revisó, cambió o decidió el equipo

Esta sección es obligatoria y solo la puede escribir el equipo. Sugerencias de qué registrar con honestidad:

- **Revisión del código:** qué archivos leyó y explicó cada integrante (por ejemplo, `0002_rls_y_funciones.sql`, `src/lib/puntos.ts`, `src/lib/api.ts`). [COMPLETAR POR EL EQUIPO]
- **Pruebas propias:** quién probó la app desde su celular y con qué resultado; si una persona ajena al grupo la probó. [COMPLETAR POR EL EQUIPO]
- **Decisiones humanas:** alcance, paleta y mascota, nombre del producto, datos que se piden y no se piden. [COMPLETAR POR EL EQUIPO]
- **Cambios hechos a mano** sobre lo que generó la IA, si los hubo. [COMPLETAR POR EL EQUIPO]
- **Textos:** quién revisó los textos de la interfaz, la privacidad y este documento. [COMPLETAR POR EL EQUIPO]

La columna "Qué revisó o cambió el equipo" de [IA_LOG.md](../IA_LOG.md) debe quedar llena antes de la entrega. Hoy está vacía.

## 4. Límites y responsabilidad

- La IA escribió la mayor parte del código. El equipo es responsable del producto y debe poder explicar y defender cada parte, como pide el curso.
- Todo lo que la IA afirma haber verificado (pruebas, revisiones a 375 px, ataques bloqueados) está en `IA_LOG.md` con su resultado. Lo que no se pudo verificar también está anotado: por ejemplo, el voto desde producción en la revalidación final.
- Los datos de la demo son ficticios. No se usaron datos personales reales para entrenar ni probar la IA.
- No se usó la IA para publicar imágenes de personas reales.

[COMPLETAR POR EL EQUIPO: fecha y firma o nombres de quienes aprueban esta declaración]
