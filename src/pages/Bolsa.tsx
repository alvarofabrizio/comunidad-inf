import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { boton, tarjeta } from '../components/estilos'
import { FilaEquipo } from '../components/FilaEquipo'
import { ErrorCarga, Esqueleto, Mensaje } from '../components/Mensaje'
import { useCarga } from '../hooks/useCarga'
import { useSesion } from '../hooks/useSesion'
import { listarInscritosPublicos, obtenerActividad, obtenerBolsa, obtenerMiInscripcion, unirseAEquipoAbierto } from '../lib/api'

// Bolsa de equipos de una actividad: personas que buscan equipo (solo alias)
// y equipos con lugares libres que marcaron "buscamos integrantes".
export default function Bolsa() {
  const { id = '' } = useParams()
  const { perfil } = useSesion()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const carga = useCarga(async () => {
    const [actividad, bolsa, inscritos, miInscripcion] = await Promise.all([
      obtenerActividad(id),
      obtenerBolsa(id),
      listarInscritosPublicos(id),
      perfil ? obtenerMiInscripcion(id) : Promise.resolve(null),
    ])
    return { actividad, bolsa, inscritos, miInscripcion }
  }, [id, perfil?.id])

  if (carga.cargando && !carga.datos) return <Esqueleto filas={3} />
  if (carga.error) return <ErrorCarga mensaje={carga.error} reintentar={carga.recargar} />
  if (!carga.datos?.actividad) return <p className="text-[15px] text-muted">Actividad no encontrada.</p>

  const { actividad, bolsa, inscritos, miInscripcion } = carga.datos
  // Puede unirse quien está registrado y todavía no tiene equipo (en la bolsa o sin inscribirse).
  const puedeUnirse = !!perfil && actividad.estado === 'abierta' && !miInscripcion?.equipo_id

  async function unirse(equipoId: string, nombre: string) {
    setOcupado(true)
    setError(null)
    setExito(null)
    try {
      await unirseAEquipoAbierto(equipoId)
      setExito(`Te uniste a ${nombre}.`)
      await carga.recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo unir al equipo.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section aria-labelledby="titulo-bolsa">
      <Link to={`/actividad/${actividad.id}`} className={`${boton.texto} -ml-1 text-sm`}>
        <ArrowLeft aria-hidden="true" className="size-4" /> {actividad.titulo}
      </Link>
      <h1 id="titulo-bolsa" className="mt-1 text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Bolsa de equipos
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-muted">
        Nadie tiene que llegar con grupo armado. Aquí están quienes buscan equipo y los equipos que buscan integrantes.
      </p>

      <div className="mt-4 space-y-3">
        {exito && <Mensaje tono="exito">{exito}</Mensaje>}
        {error && <Mensaje tono="error">{error}</Mensaje>}
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="titulo-personas">
          <h2 id="titulo-personas" className="text-lg font-semibold">
            Buscan equipo <span className="num font-normal text-muted">({bolsa.personas.length})</span>
          </h2>
          {bolsa.personas.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {bolsa.personas.map((p) => (
                <li
                  key={p.participante_id}
                  className={`rounded-full px-3 py-1.5 text-[15px] ${
                    p.participante_id === perfil?.id ? 'bg-accent text-white' : 'bg-accent-soft text-accent-ink'
                  }`}
                >
                  {p.alias}
                  {p.participante_id === perfil?.id ? ' (tú)' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
              Nadie está en la bolsa por ahora.
            </p>
          )}
          {!miInscripcion && actividad.estado === 'abierta' && (
            <p className="mt-4 text-sm text-muted">
              ¿Vienes solo?{' '}
              <Link to={`/actividad/${actividad.id}`} className="font-medium text-accent underline underline-offset-2">
                Inscríbete con «Busco equipo»
              </Link>
              .
            </p>
          )}
        </section>

        <section aria-labelledby="titulo-equipos-espacio">
          <h2 id="titulo-equipos-espacio" className="text-lg font-semibold">
            Equipos con espacio <span className="num font-normal text-muted">({bolsa.equipos.length})</span>
          </h2>
          {bolsa.equipos.length ? (
            <ul className={`${tarjeta} mt-3 divide-y divide-rule px-4`}>
              {bolsa.equipos.map((e) => (
                <FilaEquipo
                  key={e.id}
                  equipo={e}
                  miembros={inscritos.filter((i) => i.equipo_id === e.id)}
                  requiereMixto={actividad.requiere_mixto}
                  accion={
                    puedeUnirse ? (
                      <button type="button" disabled={ocupado} onClick={() => unirse(e.id, e.nombre)} className={`${boton.secundario} flex-none`}>
                        Unirme
                      </button>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
              Ningún equipo está buscando integrantes ahora.
            </p>
          )}
          {!perfil && actividad.estado === 'abierta' && (
            <p className="mt-4 text-sm text-muted">
              <Link to={`/registro?volver=/actividad/${actividad.id}/bolsa`} className="font-medium text-accent underline underline-offset-2">
                Regístrate
              </Link>{' '}
              para unirte a un equipo.
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
