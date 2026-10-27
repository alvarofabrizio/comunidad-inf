# Comunidad INF: instrucciones para Claude Code

Proyecto académico del curso Ética y RSU (PUCP, Ingeniería Informática, 2026-2). Es una aplicación web para que los estudiantes de Informática voten qué actividades quieren, se inscriban (solos o en equipo) y acumulen puntos en un ranking de temporada.

## Lee antes de escribir código
1. `docs/01_CONTEXTO_LABORATORIO.md`: qué pide el curso y qué se entrega.
2. `docs/02_CONTEXTO_PROBLEMATICA.md`: especificación funcional, prioridades P0/P1/P2, criterios de aceptación y escenario de prueba.
3. `docs/03_ARQUITECTURA.md`: stack, modelo de datos, seguridad y estructura de carpetas. No cambies el stack sin preguntar.
4. `docs/Informe_Exploracion_Lab_RSU.docx`: informe ya entregado; solo como referencia.

## Reglas
- Interfaz y textos en español (Perú). Código, nombres de tablas y variables en español sin tildes, como en `03_ARQUITECTURA.md`.
- Primero P0, luego P1, al final P2. No empieces una prioridad hasta que la anterior funcione.
- Toda llamada a datos pasa por `src/lib/api.ts`. Nada de consultas sueltas en componentes.
- Nunca expongas correos en vistas públicas ni uses la clave `service_role` en el frontend.
- No pidas ni guardes género ni otros datos sensibles. Los datos semilla son ficticios.
- Comenta la lógica no obvia (reglas de puntos, cupos, RLS) para que cualquier integrante la pueda explicar.
- Antes de dar algo por terminado: `npm run build`, `npm run test` y revisión del criterio de aceptación correspondiente.

## Registro de uso de IA (obligatorio)
Al terminar cada tarea, agrega una fila a `IA_LOG.md`:

| Fecha | Fase / tarea | Qué generó la IA | Qué revisó o cambió el equipo |
|---|---|---|---|

Deja vacía la última columna para que el equipo la complete. Registra solo lo que realmente hiciste.

## Comandos
- `npm run dev`: servidor local
- `npm run build`: compilación de producción
- `npm run test`: pruebas con Vitest
