# Comunidad INF: documento breve del producto

**Curso:** Ética y Responsabilidad Social Universitaria, PUCP 2026-2
**Equipo:** Carlos Monge, Alvaro Ferro, Mayerli López, Sebastián O'Brien y Bianca Pulido
**Enlace:** https://comunidad-inf.vercel.app

## 1. Problema

Los estudiantes de Ingeniería Informática participan poco en las actividades de su especialidad. Las actividades se eligen por intuición y no según lo que quiere la mayoría. Los avisos están dispersos (WhatsApp, Instagram, Paideia, correos, afiches) y llegan tarde. Cada actividad empieza de cero porque no hay continuidad. Además, muchas veces hay que llegar con un grupo armado, y eso deja fuera a quien no conoce a nadie. Lo vimos en un torneo de ajedrez sin asistentes presenciales, en un requisito de equipos mixtos que no se pudo cubrir y en una jornada deportiva de la que muchos no se enteraron.

## 2. Usuarios

| Usuario | Necesidad |
|---|---|
| Estudiante de Informática (desde el celular, a veces sin grupo) | Saber qué hay, opinar qué se hace e inscribirse aunque venga solo |
| Organizador (AAII o delegados, con poco tiempo y presupuesto) | Armar equipos, controlar la asistencia y dar continuidad desde un solo lugar |
| Visitante | Ver qué pasó y qué viene, sin registrarse |

## 3. Funcionalidades

- **Encuesta de intereses:** votos por juego, actividad y horario, con un límite por categoría, un solo voto por persona y resultados en barras con número y porcentaje.
- **Actividades e inscripción:** individual, creando un equipo con código de invitación o con "Busco equipo" para entrar a la **bolsa de equipos**. Se respetan el cupo y el tamaño de equipo. En las actividades mixtas, el capitán solo declara que su equipo cumple la regla.
- **Ranking de temporada:** se gana por asistir (5 puntos) más un bonus por puesto (10, 6 o 4). En equipos, cada integrante recibe los puntos de su equipo. Se muestra solo el alias.
- **Calendario:** próximas y pasadas, filtro por tipo y botón **Compartir** por WhatsApp con un texto prearmado.
- **Panel del organizador:** temporadas, actividades y encuestas; pasar personas de la bolsa a un equipo; asistencia; puestos; estados; exportar a CSV; resúmenes con foto.
- **Cuentas:** registro con correo y contraseña e **Ingresar** desde cualquier dispositivo; recuperación de contraseña por correo.
- **Privacidad:** consentimiento obligatorio, página de privacidad (Ley N.° 29733) y botón "Borrar mis datos".

## 4. Arquitectura

**En una línea:** una SPA en React (TypeScript) desplegada en Vercel que habla con Supabase (PostgreSQL con seguridad por filas, autenticación y almacenamiento).

```
 Celular / navegador
 ┌─────────────────────────────┐
 │ React + Vite (Vercel)       │  vistas públicas · panel /org
 │ src/lib/api.ts              │  única capa de datos
 └──────────────┬──────────────┘
                │ HTTPS (clave anónima pública)
 ┌──────────────▼──────────────┐
 │ Supabase                    │
 │  Auth: correo y contraseña  │
 │  PostgreSQL + RLS           │  vistas sin correos · funciones que validan
 │  Storage: fotos de resumen  │  cupo, tamaño de equipo y voto único
 └─────────────────────────────┘
```

La seguridad no depende del navegador: aunque alguien modifique la app, la base rechaza leer correos, votar dos veces, entrar a un equipo lleno o escribir en tablas de organizador. Lo comprobamos con 26 intentos automáticos (`scripts/verificar_seguridad.mjs`).

## 5. Cómo probarlo

1. Abre el enlace en el celular, crea tu cuenta (nombre, alias, correo, contraseña y consentimiento) y vota en la encuesta.
2. Inscríbete en **Torneo post-parciales** con **Busco equipo**.
3. Desde otro dispositivo, el organizador entra a `/org`, te asigna a un equipo, marca la asistencia, registra los puestos y finaliza la actividad.
4. Abre **Ranking**: aparece tu alias con los puntos correctos.

Usuario organizador de prueba: `[CORREO]` / `[CONTRASEÑA]` (se entrega en privado).

## 6. Consideraciones éticas

- **Inclusión:** nadie necesita llegar con grupo; la bolsa de equipos conecta a quien viene solo con equipos que buscan integrantes. Para la regla de equipo mixto, la plataforma **no pide ni guarda el género de nadie**: el capitán solo lo declara. La interfaz se usa en el celular, con contraste AA, etiquetas y navegación por teclado.
- **Datos personales (Ley N.° 29733):** se piden los datos mínimos (nombre, alias, correo, especialidad; el código PUCP es opcional), con consentimiento explícito. En público solo aparece el alias; el correo lo ve únicamente el organizador. Cada persona puede borrar sus datos. Una foto solo se publica si el organizador declara que las personas que aparecen lo autorizaron. Los datos semilla son ficticios.
- **Integración antes que recaudación:** no hay pagos ni inscripciones cobradas. Los puntos premian **asistir**, no solo ganar, para que participar valga la pena para todos.
- **Autoría y propiedad intelectual:** el proyecto lleva el nombre de sus cinco autores, que son sus responsables. Su uso es académico y comunitario, no comercial. Usamos IA (Claude Code) para programar y lo declaramos con detalle en `IA_LOG.md` y en la declaración de uso de IA. Los componentes inspirados en React Bits y Tux están acreditados; no se usa el logo de la AAII, solo su paleta.

## 7. Limitaciones

- Un navegador tiene una sesión a la vez: para pasar de organizador a participante hay que volver a ingresar.
- Recuperar la contraseña usa el correo gratuito de Supabase, que envía pocos correos por hora.
- No hay notificaciones, integración con Paideia ni inicio de sesión PUCP (fuera de alcance).
- El plan gratuito de Supabase pausa el proyecto tras días sin uso, y limita los registros anónimos por IP.
- Ideas pendientes: contador regresivo para cada actividad, "Agregar a mi calendario" (.ics), modo oscuro y una final de fin de ciclo con los mejores del ranking.
- Las cifras del problema (asistencia, número de estudiantes) provienen de la conversación grupal y del informe de exploración; no hicimos una medición formal.
