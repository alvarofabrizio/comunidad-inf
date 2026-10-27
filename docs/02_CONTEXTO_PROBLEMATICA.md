# Problemática elegida y solución propuesta: Comunidad INF

> Fuente: conversación grupal en clase y `Informe_Exploracion_Lab_RSU.docx`. Este archivo es la especificación funcional para construir el producto.

## 1. Problema

Los estudiantes de Ingeniería Informática de la PUCP participan poco en las actividades de su especialidad. Las actividades se organizan sin saber qué le interesa a la mayoría, se difunden tarde o no se difunden, y cada una empieza de cero porque no hay un calendario fijo. El resultado es una especialidad con muchos estudiantes que no se conocen entre sí y que pesa poco en las decisiones de la facultad.

## 2. Evidencias (lo que contó el grupo)

- Una convocatoria presencial para un torneo de ajedrez se preparó con encuesta previa y sala coordinada. No asistió nadie. En formato virtual participaron cuatro personas.
- Las bases de ese torneo exigen al menos una mujer por equipo. Solo se consiguió un contacto y no respondió. Una integrante estimó que de unos 800 estudiantes de la especialidad, alrededor de 200 son mujeres (la docente habló de unos 1000 estudiantes; la cifra está por confirmar).
- En videojuegos cada quien juega algo distinto: LoL, Valorant, Counter-Strike, FIFA, Mario Kart, Fortnite o juegos de un jugador. Al elegir uno siempre hubo reclamos.
- La jornada deportiva de intercursos (fútbol, vóley, penales entre profesores, premiación) no tuvo un resumen en redes y muchos no se enteraron de que ocurrió.
- Los torneos buscaban recaudar: inscripción pagada, premio y apertura a otras carreras, con lo que dejaban de integrar a la especialidad.
- Lo que sí convocó: la chocolatada de fin de año, actividades con comida y actividades con profesores. Surgieron ideas como un show de talentos y duelos contra profesores.
- La asociación de estudiantes (AATI) ha estado poco activa este ciclo, no tiene ambiente propio y tiene poco presupuesto.

## 3. Causas que el producto debe atacar

| Causa | Cómo se manifiesta | Funcionalidad que la ataca |
|---|---|---|
| No se conoce qué le interesa a la mayoría | Se elige el juego, la actividad o el horario por intuición | Encuesta y votación |
| Difusión tardía o inexistente | La gente se entera tarde; no queda registro | Calendario, enlace para compartir, resúmenes |
| Falta de continuidad | Cada actividad es aislada | Temporada con fechas fijas y ranking acumulado |
| Objetivo recaudatorio | Inscripción pagada, competencia | Puntos por participar, no solo por ganar |
| Barreras para sumarse | Hay que llegar con grupo armado; a mujeres y a quienes no juegan les cuesta más | Inscripción individual y bolsa de equipos |
| Recursos limitados | Poco presupuesto y personal | Panel simple para que pocos organizadores gestionen todo |

## 4. Usuarios y roles

| Rol | Quién es | Qué puede hacer | ¿Necesita cuenta? |
|---|---|---|---|
| Visitante | Cualquier persona con el enlace | Ver calendario, actividades, ranking y resúmenes | No |
| Participante | Estudiante de Informática | Votar en encuestas, inscribirse individual o con equipo, publicarse en la bolsa | No necesita contraseña. Al registrarse se crea una sesión anónima en su dispositivo ligada a un perfil con nombre, alias, correo y consentimiento. El correo es único: no se puede crear dos perfiles con el mismo correo |
| Organizador | Miembros de la AATI o delegados | Crear temporadas, actividades y encuestas; armar equipos; marcar asistencia; registrar resultados; publicar resúmenes | Sí (correo y contraseña) |

## 5. Funcionalidades priorizadas

Prioridad P0 = imprescindible para la demo de hoy. P1 = completa el producto. P2 = solo si sobra tiempo.

### P0-1. Encuesta de intereses y votación
- El organizador crea una encuesta con opciones agrupadas por categoría: `juego`, `actividad`, `horario`.
- El participante vota una o varias opciones por categoría (configurable: máximo de votos por categoría).
- Resultados visibles en barras con número y porcentaje. El total de votantes también es visible.
- Una persona vota una sola vez por encuesta (identificada por correo).

**Criterios de aceptación**
- Dado un participante que ya votó, cuando intenta votar de nuevo con el mismo correo, entonces el sistema le muestra que ya votó y sus elecciones.
- Dada una encuesta cerrada, cuando alguien la abre, entonces solo ve resultados.

### P0-2. Actividades e inscripción con bolsa de equipos
- Cada actividad tiene: título, tipo (`videojuego`, `deporte`, `social`, `academica`), juego o disciplina, descripción, fecha y hora, lugar, modalidad (`presencial`, `virtual`), cupo, tamaño de equipo (1 = individual), si exige equipo mixto, puntos por participar y estado (`borrador`, `abierta`, `cerrada`, `finalizada`).
- Inscripción de tres formas:
  1. Individual en actividad individual.
  2. Crear un equipo (queda como capitán) e invitar compartiendo un código de equipo.
  3. "Busco equipo": la persona queda en la bolsa de la actividad.
- Los equipos incompletos pueden marcarse "buscamos integrantes" y aparecen en la bolsa.
- Desde la bolsa, una persona puede pedir unirse a un equipo con espacio, y el organizador también puede asignarla.
- Si la actividad exige equipo mixto, el capitán marca una casilla declarando que su equipo cumple la regla. **La plataforma no pide ni guarda el género de nadie.**
- Respetar cupo y tamaño de equipo.

**Criterios de aceptación**
- Dada una persona en la bolsa, cuando el organizador la asigna a un equipo con espacio, entonces sale de la bolsa y aparece en el equipo.
- Dado un equipo lleno, cuando alguien intenta unirse, entonces el sistema lo impide y explica por qué.
- Dada una actividad con cupo lleno, cuando alguien intenta inscribirse, entonces ve "cupo lleno".

### P0-3. Ranking de temporada
- Puntos de una persona = suma, en las actividades de la temporada, de los puntos de participación (si se marcó su asistencia) más los puntos por posición (1.° = 10, 2.° = 6, 3.° = 4; configurables por actividad).
- En actividades por equipos, los puntos de posición se otorgan a cada miembro del equipo.
- Vista de tabla con posición, alias, actividades asistidas y puntos. Filtro por temporada.
- Se muestra el alias, nunca el correo.

**Criterios de aceptación**
- Dada una actividad finalizada con asistencia y resultados, cuando se abre el ranking, entonces los puntos reflejan exactamente la regla de cálculo.

### P1-1. Calendario de temporada
- Lista de actividades de la temporada ordenadas por fecha, con próximas y pasadas. Etiquetas por tipo.
- Botón "Compartir" en cada actividad: copia el enlace y abre WhatsApp con un texto prearmado.

### P1-2. Panel del organizador
- Inicio de sesión.
- CRUD de temporadas, actividades y encuestas.
- Por actividad: ver inscritos, equipos y bolsa; asignar personas a equipos; marcar asistencia; registrar posiciones; cambiar estado.
- Exportar inscritos a CSV.

### P1-3. Resúmenes de actividad
- Al finalizar una actividad, el organizador publica un texto corto, los ganadores y, opcionalmente, una imagen.
- Al subir una imagen debe marcar "Las personas que aparecen autorizaron su publicación". Sin esa casilla no se publica.

### P1-4. Privacidad y consentimiento
- Al registrarse, casilla obligatoria de consentimiento con enlace a la página de privacidad (qué datos se piden, para qué, quién los ve, cómo pedir su eliminación).
- Datos mínimos: nombre, alias público, correo, especialidad. Código PUCP opcional.

### P2 (opcional)
- Duelo contra profesores como tipo de actividad destacada.
- Final de fin de ciclo que clasifica automáticamente a los mejores del ranking.
- Modo oscuro.

## 6. Fuera de alcance
Pagos en línea, integración con sistemas PUCP (Campus Virtual, Paideia, inicio de sesión institucional), aplicación móvil nativa y notificaciones por correo.

## 7. Escenario de prueba (debe funcionar de punta a punta)
1. Una persona ajena al grupo abre el enlace desde su celular.
2. Se registra con nombre, alias, correo y consentimiento, y vota en la encuesta activa.
3. Se inscribe sola en un torneo por equipos con la opción "Busco equipo".
4. Un organizador inicia sesión, la ve en la bolsa y la asigna a un equipo.
5. El organizador marca asistencia, registra posiciones y finaliza la actividad.
6. La persona abre el ranking y ve su alias con los puntos correctos.

## 8. Datos semilla (para la demo)
- Temporada: "Temporada 2026-2".
- Encuesta activa "¿Qué jugamos este ciclo?" con juegos: LoL, Valorant, Counter-Strike 2, EA FC, Mario Kart, Fortnite, ajedrez; actividades: torneo de videojuegos, vóley mixto, show de talentos, duelo contra profesores, picnic; horarios: después de parciales, viernes en la tarde, sábado en la mañana.
- Actividades: "Torneo post-parciales" (videojuego, equipos de 5, mixto), "Vóley mixto de integración" (deporte, equipos de 6, mixto), "Show de talentos INF" (social, individual), "Duelo contra profes" (videojuego, equipos de 2), "Chocolatada de fin de ciclo" (social, individual).
- 12 participantes ficticios con alias inventados, algunos en equipos y otros en la bolsa, y una actividad finalizada con resultados para que el ranking no salga vacío.
- Ningún dato semilla usa nombres de personas reales.

## 9. Requisitos no funcionales
- Interfaz en español, pensada primero para celular.
- Accesible: contraste AA, etiquetas en formularios, navegable con teclado.
- Los correos nunca se exponen en vistas públicas.
- Rápida en redes móviles: sin librerías pesadas innecesarias.
- Código comentado donde la lógica no sea obvia, para que cualquier integrante pueda explicarlo.

## 10. Glosario
- **AATI**: asociación de estudiantes de Ingeniería Informática de la PUCP.
- **Cachimbo**: estudiante de primer año.
- **Paideia**: plataforma de cursos de la PUCP.
- **Intercursos**: competencias deportivas internas entre cursos o promociones.
- **Bolsa de equipos**: lista de personas que buscan equipo y de equipos que buscan integrantes.
