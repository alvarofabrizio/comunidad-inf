# Declaración de uso de inteligencia artificial

**Producto:** Comunidad INF, https://comunidad-inf.vercel.app
**Curso:** Ética y Responsabilidad Social Universitaria, PUCP 2026-2 · Horario 0882
**Equipo:** Mayerli Lopez, Alvaro Ferro, Bianca Pulido, Carlos Monge y Sebastián O'Brien

> Versión en Markdown de [Declaracion_Uso_IA.docx](Declaracion_Uso_IA.docx), que es la que se entrega. El detalle paso a paso está en [IA_LOG.md](../IA_LOG.md).

## 1. Herramientas usadas

| Herramienta | Para qué se usó |
|---|---|
| Claude Code (modelo Claude Opus 5.5, app de escritorio de Claude) | Planificar, escribir el código (frontend, SQL, pruebas, scripts), probar en el navegador integrado y redactar la documentación |
| Skills de diseño de Claude Code: ui-ux-pro-max, design-taste-frontend, impeccable | Sistema de diseño, accesibilidad (contraste AA), revisión visual automatizada y piso de calidad de la interfaz |
| React Bits (reactbits.dev), como referencia | Inspiración para CountUp, ClickSpark y PixelCard, reescritos sin dependencias |
| ChatGPT / Claude Web | Apoyo en la estructuración de la investigación cualitativa inicial para el Informe de Exploración del Problema y síntesis de entrevistas a estudiantes |
| Herramientas de diseño gráfico (Canva / Figma) | Adaptación de la paleta institucional de la AAII, diseño de la mascota "Pingüi" y elaboración del afiche promocional |

## 2. Cómo apoyó la IA

- **Planificación:** leyó la especificación, propuso un plan por fases y señaló las ambigüedades con una opción simple para cada una.
- **Base de datos y seguridad:** esquema en PostgreSQL (Supabase), seguridad por filas, funciones que validan cupo, tamaño de equipo y voto único, y datos de prueba ficticios.
- **Interfaz:** pantallas públicas y panel del organizador, accesibles y pensadas para celular.
- **Identidad visual:** paleta verde de la AAII, logo y la mascota Pingüi dibujada en código a partir de la referencia del equipo.
- **Pruebas y verificación:** pruebas automáticas de la regla de puntos, recorrido del escenario de prueba e intentos de ataque bloqueados por la base.
- **Despliegue:** configuración para Vercel y diagnóstico de errores del despliegue.
- **Documentación:** borradores del README, el documento breve, la guía interna, las preguntas de defensa y esta declaración.

## 3. Prompts usados (parafraseados)

| N.° | Etapa | Lo que se le pidió |
|---|---|---|
| 1 | Plan | Leer los documentos sin escribir código, resumir el problema, proponer el plan en seis fases, listar dudas eligiendo la opción más simple y explicar la configuración de Supabase |
| 2 | Base de datos | Crear el proyecto, el esquema con restricciones, la seguridad por filas, las funciones con reglas, los datos semilla ficticios y la capa de datos |
| 3 | Vistas públicas | Construir registro, privacidad, encuesta, actividad con inscripción individual, por equipo o en la bolsa, y ranking, para celular y accesibles |
| 4 | Panel del organizador | Panel con inicio de sesión: temporadas, actividades y encuestas; asignar desde la bolsa, asistencia, puestos, finalizar y exportar a CSV |
| 5 | Ranking, calendario y resúmenes | Probar la regla de puntos, calendario con compartir por WhatsApp y resúmenes con foto solo si hay autorización |
| 6 | Avance y configuración | Resumir lo hecho y lo pendiente, y dar el paso a paso de Supabase, GitHub y Vercel |
| 7 | Prueba del escenario | Recorrer el escenario como participante y como organizador con datos reales, y limpiar los datos de prueba |
| 8 | Verificación y despliegue | Revisar las vistas a 375 px, intentar ataques con la clave pública, preparar Vercel y revisar por qué el sitio no cargaba |
| 9 | Identidad visual | Cambiar al verde de la AAII usando su afiche y logo, crear un logo, agregar un pingüino como mascota y usar React Bits |
| 10 | Mascota y autoría | Poner los nombres del equipo y redibujar la mascota según una imagen de referencia, llamada "Pingüi" |
| 11 | Documentación | Redactar README, documento breve, declaración de IA y preguntas de defensa, apoyándose en una propuesta previa del equipo |
| 12 | Documentos en Word | Pasar el documento breve y la declaración a Word con el formato del informe de exploración |
| 13 | Acceso y guía interna | Explicar cómo entrar como administrador y agregar organizadores, y escribir una guía interna |
| 14 | Cuentas | Inicio de sesión con correo y contraseña desde cualquier dispositivo, sin afectar los datos ya creados |
| 15 | Limpieza | Explicar cómo manejar las cuentas creadas y preparar un script para dejar solo la cuenta del organizador |

## 4. Límites y responsabilidad

- La IA escribió la mayor parte del código y de los borradores. El equipo es responsable del producto y de lo entregado, y debe poder explicar y defender cada parte.
- Lo que la IA verificó está registrado en IA_LOG.md con su resultado; lo que no se pudo verificar también está anotado.
- Los datos de la demostración son ficticios. No se usaron datos personales reales para trabajar con la IA.
- No se usó la IA para publicar imágenes de personas reales.
