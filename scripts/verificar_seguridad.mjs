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
console.log(fallas === 0 ? '\nTodos los intentos fueron bloqueados.' : `\n${fallas} intento(s) NO fueron bloqueados. Revisar la RLS.`)
process.exit(fallas === 0 ? 0 : 1)
