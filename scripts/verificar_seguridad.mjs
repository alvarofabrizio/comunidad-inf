// Verifica la seguridad de la base con la clave anónima (la misma que usa el navegador).
// Cada intento DEBE fallar o devolver vacío. Uso:  node scripts/verificar_seguridad.mjs
// Lee VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY de .env.local.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL_BASE = env.VITE_SUPABASE_URL
const CLAVE = env.VITE_SUPABASE_ANON_KEY
const cabeceras = { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

async function pedir(metodo, ruta, cuerpo) {
  const r = await fetch(`${URL_BASE}/rest/v1/${ruta}`, { method: metodo, headers: cabeceras, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
  const texto = await r.text()
  let datos
  try { datos = JSON.parse(texto) } catch { datos = texto }
  return { estado: r.status, datos }
}

const TEMPORADA = 'a0000000-0000-0000-0000-000000000001'
const ACTIVIDAD = 'c0000000-0000-0000-0000-000000000001'
const EQUIPO = 'd0000000-0000-0000-0000-000000000005'

const pruebas = [
  ['Leer correos de participantes', () => pedir('GET', 'participantes?select=correo'), (r) => Array.isArray(r.datos) && r.datos.length === 0],
  ['Leer correos vía la vista pública', () => pedir('GET', 'vista_participantes_publica?select=correo'), (r) => r.estado >= 400],
  ['Leer códigos de invitación de equipos', () => pedir('GET', 'equipos?select=codigo_invitacion'), (r) => Array.isArray(r.datos) && r.datos.length === 0],
  ['Leer inscripciones (asistencia)', () => pedir('GET', 'inscripciones?select=*'), (r) => Array.isArray(r.datos) && r.datos.length === 0],
  ['Votar sin registrarse', () => pedir('POST', 'rpc/votar', { p_encuesta: 'b0000000-0000-0000-0000-000000000001', p_opciones: [] }), (r) => r.estado >= 400],
  ['Insertar un voto directo en la tabla', () => pedir('POST', 'votos', { encuesta_id: 'b0000000-0000-0000-0000-000000000001', opcion_id: '00000000-0000-0000-0000-000000000000', participante_id: '00000000-0000-0000-0000-000000000000' }), (r) => r.estado >= 400],
  ['Unirse a un equipo sin registrarse', () => pedir('POST', 'rpc/unirse_equipo', { p_codigo: 'NULPTR' }), (r) => r.estado >= 400],
  ['Asignar a un equipo (función de organizador)', () => pedir('POST', 'rpc/asignar_a_equipo', { p_inscripcion: EQUIPO, p_equipo: EQUIPO }), (r) => r.estado >= 400],
  ['Crear una actividad', () => pedir('POST', 'actividades', { temporada_id: TEMPORADA, titulo: 'Intruso', tipo: 'social', fecha_hora: new Date().toISOString(), lugar: 'x', modalidad: 'virtual', cupo: 1 }), (r) => r.estado >= 400],
  ['Cambiar el estado de una actividad', () => pedir('PATCH', `actividades?id=eq.${ACTIVIDAD}`, { estado: 'finalizada' }), (r) => r.estado >= 400 || (Array.isArray(r.datos) && r.datos.length === 0)],
  ['Registrar un resultado', () => pedir('POST', 'resultados', { actividad_id: ACTIVIDAD, equipo_id: EQUIPO, posicion: 1 }), (r) => r.estado >= 400],
  ['Marcar asistencia', () => pedir('PATCH', `inscripciones?actividad_id=eq.${ACTIVIDAD}`, { asistio: true }), (r) => r.estado >= 400 || (Array.isArray(r.datos) && r.datos.length === 0)],
  ['Hacerse organizador', () => pedir('POST', 'organizadores', { user_id: '00000000-0000-0000-0000-000000000000', nombre: 'yo' }), (r) => r.estado >= 400],
  ['Escribir en una vista pública', () => pedir('PATCH', 'vista_participantes_publica?alias=eq.PixelPuma', { alias: 'hack' }), (r) => r.estado >= 400],
]

let fallas = 0
for (const [nombre, intento, bloqueado] of pruebas) {
  const r = await intento()
  const ok = bloqueado(r)
  if (!ok) fallas++
  const detalle = typeof r.datos === 'object' && r.datos?.message ? r.datos.message : JSON.stringify(r.datos).slice(0, 80)
  console.log(`${ok ? 'BLOQUEADO ' : 'PERMITIDO!'}  ${nombre}  [${r.estado}] ${detalle}`)
}
// ---------------------------------------------------------------------------
// Parte 2: con sesiones anónimas reales (como un participante registrado).
// Crea 4 participantes de prueba, intenta votar dos veces, llena el equipo
// "Ctrl Alt Win" (2/5) con 3 de ellos y prueba que el 4.° no pueda entrar.
// Al final cada uno borra su perfil: se van sus votos e inscripciones y el
// equipo vuelve a 2/5. Quedan usuarios anónimos sin datos en Authentication.
// ---------------------------------------------------------------------------
console.log('\n--- Con sesión anónima de participante ---')

async function pedirCon(token, metodo, ruta, cuerpo) {
  const r = await fetch(`${URL_BASE}/rest/v1/${ruta}`, {
    method: metodo,
    headers: { ...cabeceras, Authorization: `Bearer ${token}` },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const texto = await r.text()
  let datos
  try { datos = JSON.parse(texto) } catch { datos = texto }
  return { estado: r.status, datos }
}

async function nuevoParticipante(n) {
  const r = await fetch(`${URL_BASE}/auth/v1/signup`, { method: 'POST', headers: { apikey: CLAVE, 'Content-Type': 'application/json' }, body: '{}' })
  const sesion = await r.json()
  if (!sesion.access_token) throw new Error(`No se pudo crear la sesión anónima: ${JSON.stringify(sesion)}`)
  const sello = Date.now().toString(36)
  const alta = await pedirCon(sesion.access_token, 'POST', 'participantes', {
    id: sesion.user.id, nombre: `Seguridad ${n}`, alias: `Seg${n}${sello}`.slice(0, 20),
    correo: `seguridad${n}.${sello}@example.com`, especialidad: 'Ingeniería Informática', consentimiento: true,
  })
  if (alta.estado >= 400) throw new Error(`No se pudo crear el perfil: ${JSON.stringify(alta.datos)}`)
  return { token: sesion.access_token, id: sesion.user.id }
}

const mensaje = (r) => (typeof r.datos === 'object' && r.datos?.message) || JSON.stringify(r.datos).slice(0, 90)
let fallas2 = 0
function revisar(nombre, r, bloqueado) {
  const ok = bloqueado(r)
  if (!ok) fallas2++
  console.log(`${ok ? 'BLOQUEADO ' : 'PERMITIDO!'}  ${nombre}  [${r.estado}] ${mensaje(r)}`)
}

const personas = []
try {
  for (let n = 1; n <= 4; n++) personas.push(await nuevoParticipante(n))
  const [p1, p2, p3, p4] = personas
  const ENCUESTA = 'b0000000-0000-0000-0000-000000000001'
  const opciones = await pedirCon(p1.token, 'GET', `opciones_encuesta?encuesta_id=eq.${ENCUESTA}&categoria=eq.juego&select=id&limit=2`)
  const [o1, o2] = opciones.datos.map((o) => o.id)

  const primerVoto = await pedirCon(p1.token, 'POST', 'rpc/votar', { p_encuesta: ENCUESTA, p_opciones: [o1] })
  console.log(`${primerVoto.estado < 400 ? 'PERMITIDO ' : 'ERROR!    '}  Primer voto (debe aceptarse)  [${primerVoto.estado}]`)
  if (primerVoto.estado >= 400) fallas2++
  revisar('Votar dos veces', await pedirCon(p1.token, 'POST', 'rpc/votar', { p_encuesta: ENCUESTA, p_opciones: [o2] }), (r) => r.estado >= 400)
  revisar('Votar dos veces insertando directo en la tabla', await pedirCon(p1.token, 'POST', 'votos', { encuesta_id: ENCUESTA, opcion_id: o2, participante_id: p1.id }), (r) => r.estado >= 400)

  revisar('Leer correos de otros participantes', await pedirCon(p1.token, 'GET', `participantes?select=correo&id=neq.${p1.id}`), (r) => Array.isArray(r.datos) && r.datos.length === 0)
  revisar('Crear un perfil con el id de otra persona', await pedirCon(p1.token, 'POST', 'participantes', { id: p2.id, nombre: 'Suplantador', alias: 'Suplantador1', correo: 'suplanta@example.com', consentimiento: true }), (r) => r.estado >= 400)

  // Ctrl Alt Win tiene 2 de 5: con 3 más se llena.
  for (const p of [p1, p2, p3]) {
    const r = await pedirCon(p.token, 'POST', 'rpc/unirse_equipo', { p_codigo: 'CTRLAW' })
    if (r.estado >= 400) { fallas2++; console.log(`ERROR!      No se pudo llenar el equipo: ${mensaje(r)}`) }
  }
  revisar('Unirse a un equipo lleno (6.° en un equipo de 5)', await pedirCon(p4.token, 'POST', 'rpc/unirse_equipo', { p_codigo: 'CTRLAW' }), (r) => r.estado >= 400)

  revisar('Asignar personas a equipos (solo organizador)', await pedirCon(p4.token, 'POST', 'rpc/asignar_a_equipo', { p_inscripcion: p4.id, p_equipo: 'd0000000-0000-0000-0000-000000000006' }), (r) => r.estado >= 400)
  revisar('Marcarse asistencia', await pedirCon(p1.token, 'PATCH', `inscripciones?participante_id=eq.${p1.id}`, { asistio: true }), (r) => r.estado >= 400 || (Array.isArray(r.datos) && r.datos.length === 0))
  revisar('Registrar un resultado', await pedirCon(p1.token, 'POST', 'resultados', { actividad_id: ACTIVIDAD, equipo_id: 'd0000000-0000-0000-0000-000000000006', posicion: 1 }), (r) => r.estado >= 400)
  revisar('Finalizar una actividad', await pedirCon(p1.token, 'PATCH', `actividades?id=eq.${ACTIVIDAD}`, { estado: 'finalizada' }), (r) => r.estado >= 400 || (Array.isArray(r.datos) && r.datos.length === 0))
  revisar('Hacerse organizador', await pedirCon(p1.token, 'POST', 'organizadores', { user_id: p1.id, nombre: 'yo' }), (r) => r.estado >= 400)
  revisar('Ver códigos de invitación ajenos', await pedirCon(p4.token, 'GET', 'equipos?select=codigo_invitacion'), (r) => Array.isArray(r.datos) && r.datos.length === 0)
} finally {
  // Limpieza: cada participante de prueba borra su propio perfil (y con él votos e inscripciones).
  for (const p of personas) await pedirCon(p.token, 'DELETE', `participantes?id=eq.${p.id}`)
  const equipo = await pedir('GET', 'vista_equipos_publica?nombre=eq.Ctrl%20Alt%20Win&select=miembros')
  console.log(`\nLimpieza: ${personas.length} perfiles de prueba borrados; Ctrl Alt Win quedó con ${equipo.datos?.[0]?.miembros} integrantes.`)
}

const total = fallas + fallas2
console.log(total === 0 ? '\nTodos los intentos fueron bloqueados.' : `\n${total} intento(s) NO fueron bloqueados. Revisar la RLS.`)
process.exit(total === 0 ? 0 : 1)
