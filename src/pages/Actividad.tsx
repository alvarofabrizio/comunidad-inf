import { CalendarDays, Copy, MapPin, Monitor, Users } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AsientosEquipo } from '../components/AsientosEquipo'
import { BotonCompartir } from '../components/BotonCompartir'
import { boton, campo, tarjeta } from '../components/estilos'
import { FilaEquipo } from '../components/FilaEquipo'
import { ErrorCarga, Esqueleto, Mensaje } from '../components/Mensaje'
import { RequiereRegistro } from '../components/RequiereRegistro'
import { useCarga } from '../hooks/useCarga'
import { useSesion } from '../hooks/useSesion'
import {
  actualizarMiEquipo,
  crearEquipo,
  inscribirse,
  listarEquipos,
  listarInscritosPublicos,
  obtenerActividad,
  obtenerMiEquipo,
  obtenerMiInscripcion,
  obtenerResumen,
  unirseAEquipoAbierto,
  unirseConCodigo,
} from '../lib/api'
import { etiquetaEstado, etiquetaModalidad, etiquetaTipo, fechaHora } from '../lib/formato'
import type { ActividadConCupo, EquipoPublico, Inscripcion, InscripcionPublica, MiEquipo } from '../types'

type Modo = 'bolsa' | 'crear' | 'codigo'

export default function Actividad() {
  const { id = '' } = useParams()
  const { perfil } = useSesion()
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [actividad, equipos, inscritos, miInscripcion, miEquipo, resumen] = await Promise.all([
      obtenerActividad(id),
      listarEquipos(id),
      listarInscritosPublicos(id),
      perfil ? obtenerMiInscripcion(id) : Promise.resolve(null),
      perfil ? obtenerMiEquipo(id) : Promise.resolve(null),
      obtenerResumen(id),
    ])
    return { actividad, equipos, inscritos, miInscripcion, miEquipo, resumen }
  }, [id, perfil?.id])

  if (cargando && !datos) return <Esqueleto filas={3} alto="h-28" />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (!datos?.actividad) {
    return (
      <section>
        <h1 className="text-2xl font-bold">Actividad no encontrada</h1>
        <p className="mt-2 text-[15px] text-muted">
          Puede que el enlace esté incompleto. <Link to="/calendario" className="font-medium text-accent underline">Ver el calendario</Link>
        </p>
      </section>
    )
  }

  const { actividad, equipos, inscritos, miInscripcion, miEquipo, resumen } = datos
  const porEquipos = actividad.tamano_equipo > 1
  const ocupacion = Math.min(1, actividad.inscritos / actividad.cupo)

  return (
    <article aria-labelledby="titulo-actividad">
      <header className={`${tarjeta} p-4 md:p-6`}>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-medium text-accent-ink">
            {etiquetaTipo[actividad.tipo]}
            {actividad.juego_o_disciplina ? ` · ${actividad.juego_o_disciplina}` : ''}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[13px] font-medium ${
              actividad.estado === 'abierta' ? 'bg-positive-bg text-positive-ink' : 'bg-raised text-muted'
            }`}
          >
            {etiquetaEstado[actividad.estado]}
          </span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 id="titulo-actividad" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
            {actividad.titulo}
          </h1>
          {actividad.estado !== 'finalizada' && <BotonCompartir actividad={actividad} compacto />}
        </div>
        <ul className="mt-3 space-y-1.5 text-[15px] text-ink">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4 flex-none text-muted" />
            {fechaHora(actividad.fecha_hora)}
          </li>
          <li className="flex items-center gap-2">
            {actividad.modalidad === 'virtual' ? (
              <Monitor aria-hidden="true" className="size-4 flex-none text-muted" />
            ) : (
              <MapPin aria-hidden="true" className="size-4 flex-none text-muted" />
            )}
            {etiquetaModalidad[actividad.modalidad]} · {actividad.lugar}
          </li>
          <li className="flex items-center gap-2">
            <Users aria-hidden="true" className="size-4 flex-none text-muted" />
            {porEquipos ? `Equipos de ${actividad.tamano_equipo}` : 'Individual'}
            {actividad.requiere_mixto ? ' · equipos mixtos' : ''}
          </li>
        </ul>

        {/* Cupo: personas inscritas (incluida la bolsa) sobre el cupo total. */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Cupo</span>
            <span className="num">
              <strong className="font-semibold">{actividad.inscritos}</strong>
              <span className="text-muted"> de {actividad.cupo} · </span>
              <strong className={`font-semibold ${actividad.lugares_libres <= 0 ? 'text-negative' : ''}`}>
                {actividad.lugares_libres <= 0 ? 'cupo lleno' : `${actividad.lugares_libres} lugares libres`}
              </strong>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent-track" aria-hidden="true">
            <div className="h-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${ocupacion})` }} />
          </div>
        </div>

        <p className="mt-4 text-sm text-muted">
          Puntos: <span className="num font-medium text-ink">+{actividad.puntos_participacion}</span> por asistir ·
          1.° <span className="num font-medium text-ink">+{actividad.puntos_1}</span> · 2.°{' '}
          <span className="num font-medium text-ink">+{actividad.puntos_2}</span> · 3.°{' '}
          <span className="num font-medium text-ink">+{actividad.puntos_3}</span>
          {porEquipos ? ' (cada integrante recibe los puntos de su equipo)' : ''}
        </p>
      </header>

      {actividad.descripcion && <p className="mt-6 max-w-prose text-base leading-relaxed">{actividad.descripcion}</p>}

      {resumen && (
        <section aria-labelledby="titulo-resumen" className={`${tarjeta} mt-6 overflow-hidden`}>
          {resumen.imagen_url && resumen.imagen_autorizada && (
            <img src={resumen.imagen_url} alt={`Foto de ${actividad.titulo}`} loading="lazy" className="aspect-[16/9] w-full object-cover" />
          )}
          <div className="p-4">
            <h2 id="titulo-resumen" className="text-lg font-semibold">Cómo nos fue</h2>
            <p className="mt-1 text-base leading-relaxed">{resumen.texto}</p>
            {resumen.ganadores && <p className="mt-2 text-[15px] font-medium text-accent-ink">Ganadores: {resumen.ganadores}</p>}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-inscripcion" className="mt-8">
        <h2 id="titulo-inscripcion" className="text-lg font-semibold">
          Tu inscripción
        </h2>
        <div className="mt-3">
          {perfil ? (
            <PanelInscripcion
              actividad={actividad}
              equipos={equipos}
              inscritos={inscritos}
              miInscripcion={miInscripcion}
              miEquipo={miEquipo}
              alCambiar={recargar}
            />
          ) : (
            <RequiereRegistro accion="inscribirte" />
          )}
        </div>
      </section>

      {porEquipos ? (
        <section aria-labelledby="titulo-equipos" className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="titulo-equipos" className="text-lg font-semibold">
              Equipos <span className="num font-normal text-muted">({equipos.length})</span>
            </h2>
            <Link to={`/actividad/${actividad.id}/bolsa`} className={boton.texto}>
              Ver bolsa de equipos
            </Link>
          </div>
          {equipos.length === 0 ? (
            <p className="mt-2 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
              Aún no hay equipos. Puedes crear el primero.
            </p>
          ) : (
            <ul className={`${tarjeta} mt-3 divide-y divide-rule px-4`}>
              {equipos.map((e) => (
                <FilaEquipo
                  key={e.id}
                  equipo={e}
                  miembros={inscritos.filter((i) => i.equipo_id === e.id)}
                  requiereMixto={actividad.requiere_mixto}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section aria-labelledby="titulo-inscritos" className="mt-10">
          <h2 id="titulo-inscritos" className="text-lg font-semibold">
            Inscritos <span className="num font-normal text-muted">({inscritos.length})</span>
          </h2>
          <p className="mt-2 text-[15px] text-muted">
            {inscritos.length ? inscritos.map((i) => i.alias).join(', ') : 'Todavía nadie. ¡Sé la primera persona!'}
          </p>
        </section>
      )}
    </article>
  )
}

function PanelInscripcion({
  actividad,
  equipos,
  inscritos,
  miInscripcion,
  miEquipo,
  alCambiar,
}: {
  actividad: ActividadConCupo
  equipos: EquipoPublico[]
  inscritos: InscripcionPublica[]
  miInscripcion: Inscripcion | null
  miEquipo: MiEquipo | null
  alCambiar: () => Promise<void>
}) {
  const porEquipos = actividad.tamano_equipo > 1
  const [modo, setModo] = useState<Modo>('bolsa')
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [declaraMixto, setDeclaraMixto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  /** Ejecuta una acción de la API mostrando su resultado y recargando la página. */
  async function hacer(accion: () => Promise<unknown>, mensajeExito: string) {
    setOcupado(true)
    setError(null)
    setExito(null)
    try {
      await accion()
      setExito(mensajeExito)
      await alCambiar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setOcupado(false)
    }
  }

  const avisos = (
    <>
      {exito && <Mensaje tono="exito">{exito}</Mensaje>}
      {error && <Mensaje tono="error">{error}</Mensaje>}
    </>
  )

  const equiposConEspacio = equipos.filter((e) => e.buscando_integrantes && e.lugares_libres > 0)

  // --- Ya está en un equipo ---
  if (miInscripcion?.equipo_id && miEquipo) {
    const equipo = equipos.find((e) => e.id === miEquipo.id)
    const miembros = inscritos.filter((i) => i.equipo_id === miEquipo.id)
    return (
      <div className="space-y-3">
        {avisos}
        <div className="rounded-[8px] bg-accent-soft p-4 text-accent-ink">
          <p className="text-[15px]">
            Estás en <strong className="font-semibold">{miEquipo.nombre}</strong>
            {miEquipo.es_capitan ? ' como capitán' : ''}.
          </p>
          {equipo && (
            <div className="mt-2">
              <AsientosEquipo miembros={equipo.miembros} tamano={equipo.tamano_equipo} />
            </div>
          )}
          <p className="mt-2 text-sm">{miembros.map((m) => m.alias).join(', ')}</p>
          <div className="mt-4">
            <p className="text-sm">Código para invitar a tu equipo:</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="num rounded-[6px] bg-surface px-3 py-2 text-xl font-semibold tracking-[0.08em] text-ink">
                {miEquipo.codigo_invitacion}
              </span>
              <BotonCopiar texto={miEquipo.codigo_invitacion} />
            </div>
          </div>
        </div>
        {miEquipo.es_capitan && (
          <div className={`${tarjeta} space-y-3 p-4`}>
            <p className="text-sm font-medium">Como capitán puedes:</p>
            <Casilla
              id="buscando"
              marcada={miEquipo.buscando_integrantes}
              deshabilitada={ocupado}
              alCambiar={(v) => hacer(() => actualizarMiEquipo(miEquipo.id, { buscando_integrantes: v }), v ? 'Tu equipo aparece en la bolsa.' : 'Tu equipo ya no aparece en la bolsa.')}
            >
              Buscamos integrantes (el equipo aparece en la bolsa y cualquiera puede unirse)
            </Casilla>
            {actividad.requiere_mixto && (
              <Casilla
                id="mixto"
                marcada={miEquipo.declara_cumple_mixto}
                deshabilitada={ocupado}
                alCambiar={(v) => hacer(() => actualizarMiEquipo(miEquipo.id, { declara_cumple_mixto: v }), 'Declaración actualizada.')}
              >
                Declaro que nuestro equipo cumple la regla de equipo mixto. No se pide ni se guarda el género de nadie.
              </Casilla>
            )}
          </div>
        )}
      </div>
    )
  }

  // --- Está en la bolsa ---
  if (miInscripcion?.en_bolsa) {
    return (
      <div className="space-y-3">
        {avisos}
        <Mensaje tono="info">
          Estás en la bolsa de equipos. Un organizador puede asignarte a un equipo, o puedes unirte tú a uno con espacio.
        </Mensaje>
        {equiposConEspacio.length > 0 && (
          <ul className={`${tarjeta} divide-y divide-rule px-4`}>
            {equiposConEspacio.map((e) => (
              <FilaEquipo
                key={e.id}
                equipo={e}
                miembros={inscritos.filter((i) => i.equipo_id === e.id)}
                requiereMixto={actividad.requiere_mixto}
                accion={
                  <button
                    type="button"
                    disabled={ocupado}
                    className={`${boton.secundario} flex-none`}
                    onClick={() => hacer(() => unirseAEquipoAbierto(e.id), `Te uniste a ${e.nombre}.`)}
                  >
                    Unirme
                  </button>
                }
              />
            ))}
          </ul>
        )}
        <FormCodigo codigo={codigo} setCodigo={setCodigo} ocupado={ocupado} enviar={() => hacer(() => unirseConCodigo(codigo), 'Te uniste al equipo.')} />
      </div>
    )
  }

  // --- Inscripción individual ---
  if (miInscripcion) {
    return (
      <Mensaje tono="exito">
        Estás inscrito. Tus puntos se suman cuando el organizador marque tu asistencia el día de la actividad.
      </Mensaje>
    )
  }

  // --- Aún no inscrito ---
  if (actividad.estado !== 'abierta') {
    return <Mensaje tono="info">Las inscripciones no están abiertas ({etiquetaEstado[actividad.estado].toLowerCase()}).</Mensaje>
  }
  if (actividad.lugares_libres <= 0) {
    return (
      <Mensaje tono="error">
        Cupo lleno: ya hay {actividad.inscritos} de {actividad.cupo} personas inscritas.
      </Mensaje>
    )
  }

  if (!porEquipos) {
    return (
      <div className="space-y-3">
        {avisos}
        <button type="button" disabled={ocupado} className={`${boton.primario} w-full sm:w-auto`} onClick={() => hacer(() => inscribirse(actividad.id, 'individual'), 'Listo, quedaste inscrito.')}>
          {ocupado ? 'Inscribiendo…' : 'Inscribirme'}
        </button>
      </div>
    )
  }

  const opciones: { valor: Modo; texto: string }[] = [
    { valor: 'bolsa', texto: 'Busco equipo' },
    { valor: 'crear', texto: 'Crear equipo' },
    { valor: 'codigo', texto: 'Tengo un código' },
  ]

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Cómo quieres inscribirte" className="grid grid-cols-3 gap-1 rounded-[8px] bg-raised p-1">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={modo === o.valor}
            onClick={() => {
              setModo(o.valor)
              setError(null)
            }}
            className={`min-h-11 rounded-[6px] px-1 text-sm font-medium transition-colors ${
              modo === o.valor ? 'bg-surface text-ink ring-1 ring-border' : 'text-muted hover:text-ink'
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>

      <div className={`${tarjeta} p-4`}>
        {modo === 'bolsa' && (
          <>
            <p className="text-[15px]">
              Te inscribes solo y quedas en la bolsa: los organizadores te asignan a un equipo, o tú eliges uno que esté
              buscando integrantes.
            </p>
            <button type="button" disabled={ocupado} className={`${boton.primario} mt-4 w-full sm:w-auto`} onClick={() => hacer(() => inscribirse(actividad.id, 'bolsa'), 'Listo, estás en la bolsa de equipos.')}>
              {ocupado ? 'Inscribiendo…' : 'Inscribirme y buscar equipo'}
            </button>
          </>
        )}
        {modo === 'crear' && (
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              void hacer(() => crearEquipo(actividad.id, nombreEquipo, declaraMixto), 'Equipo creado. Comparte el código con tu equipo.')
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="nombre-equipo" className={campo.etiqueta}>Nombre del equipo</label>
              <input id="nombre-equipo" className={campo.input} maxLength={40} value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} required minLength={2} />
              <p className={campo.ayuda}>Quedas como capitán y recibes un código para invitar a los demás.</p>
            </div>
            {actividad.requiere_mixto && (
              <Casilla id="mixto-nuevo" marcada={declaraMixto} alCambiar={setDeclaraMixto}>
                Declaro que nuestro equipo cumplirá la regla de equipo mixto. Puedes marcarlo después, cuando el equipo
                esté completo. No se pide ni se guarda el género de nadie.
              </Casilla>
            )}
            <button type="submit" disabled={ocupado} className={`${boton.primario} w-full sm:w-auto`}>
              {ocupado ? 'Creando…' : 'Crear equipo'}
            </button>
          </form>
        )}
        {modo === 'codigo' && (
          <FormCodigo codigo={codigo} setCodigo={setCodigo} ocupado={ocupado} enviar={() => hacer(() => unirseConCodigo(codigo), 'Te uniste al equipo.')} />
        )}
      </div>
      {avisos}
      {modo !== 'codigo' && equiposConEspacio.length > 0 && (
        <p className="text-sm text-muted">
          {equiposConEspacio.length === 1 ? 'Hay 1 equipo buscando integrantes' : `Hay ${equiposConEspacio.length} equipos buscando integrantes`}:{' '}
          <Link to={`/actividad/${actividad.id}/bolsa`} className="font-medium text-accent underline underline-offset-2">ver la bolsa</Link>.
        </p>
      )}
    </div>
  )
}

function FormCodigo({ codigo, setCodigo, ocupado, enviar }: { codigo: string; setCodigo: (v: string) => void; ocupado: boolean; enviar: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        enviar()
      }}
    >
      <label htmlFor="codigo-equipo" className={campo.etiqueta}>Código de equipo</label>
      <div className="mt-2 flex gap-2">
        <input
          id="codigo-equipo"
          className={`${campo.input} num mt-0 tracking-[0.08em] uppercase`}
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          aria-describedby="codigo-equipo-ayuda"
          required
        />
        <button type="submit" disabled={ocupado || codigo.length !== 6} className={`${boton.primario} flex-none`}>
          Unirme
        </button>
      </div>
      <p id="codigo-equipo-ayuda" className={campo.ayuda}>Son 6 letras o números; te lo pasa el capitán.</p>
    </form>
  )
}

function Casilla({ id, marcada, deshabilitada, alCambiar, children }: { id: string; marcada: boolean; deshabilitada?: boolean; alCambiar: (v: boolean) => void; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={marcada} disabled={deshabilitada} onChange={(e) => alCambiar(e.target.checked)} className="mt-0.5 size-5 flex-none accent-[var(--color-accent)]" />
      <label htmlFor={id} className="text-[15px] text-ink">{children}</label>
    </div>
  )
}

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      className={`${boton.secundario} min-h-11`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        } catch {
          setCopiado(false)
        }
      }}
    >
      <Copy aria-hidden="true" className="size-4" />
      <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar'}</span>
    </button>
  )
}
