import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { boton, campo, tarjeta } from '../../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../../components/Mensaje'
import { useCarga } from '../../hooks/useCarga'
import { agregarOpcion, eliminarEncuesta, eliminarOpcion, guardarEncuesta, obtenerEncuesta, obtenerResultadosEncuesta } from '../../lib/api'
import { etiquetaCategoria, ordenCategorias } from '../../lib/formato'
import type { CategoriaOpcion } from '../../types'

// Hora de Lima = UTC-5 todo el año (ver EditorActividad).
const aCampoLima = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 16)
const desdeCampoLima = (valor: string) => new Date(`${valor}:00-05:00`).toISOString()

export default function EditorEncuesta() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const { datos, error, cargando, recargar } = useCarga(
    async () => (id ? { encuesta: await obtenerEncuesta(id), resultados: await obtenerResultadosEncuesta(id) } : null),
    [id],
  )

  const [titulo, setTitulo] = useState('')
  const [max, setMax] = useState(1)
  const [abierta, setAbierta] = useState(true)
  const [cierra, setCierra] = useState('')
  const [nuevas, setNuevas] = useState<Record<CategoriaOpcion, string>>({ juego: '', actividad: '', horario: '' })
  const [aviso, setAviso] = useState<{ tono: 'exito' | 'error'; texto: string } | null>(null)
  const [cargadoForm, setCargadoForm] = useState(false)

  useEffect(() => {
    const e = datos?.encuesta
    if (e && !cargadoForm) {
      setTitulo(e.titulo)
      setMax(e.max_votos_por_categoria)
      setAbierta(e.abierta)
      setCierra(e.cierra_en ? aCampoLima(e.cierra_en) : '')
      setCargadoForm(true)
    }
  }, [datos, cargadoForm])

  if (cargando && id && !datos) return <Esqueleto filas={3} />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (id && !datos?.encuesta) return <p className="text-[15px] text-muted">Encuesta no encontrada.</p>

  const encuesta = datos?.encuesta
  const totalVotantes = datos?.resultados[0]?.total_votantes ?? 0

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setAviso(null)
    try {
      const guardada = await guardarEncuesta({
        id,
        temporada_id: encuesta?.temporada_id ?? params.get('temporada') ?? '',
        titulo,
        max_votos_por_categoria: max,
        abierta,
        cierra_en: cierra ? desdeCampoLima(cierra) : null,
      })
      if (!id) navegar(`/org/encuesta/${guardada.id}`, { replace: true })
      else {
        setAviso({ tono: 'exito', texto: 'Encuesta guardada.' })
        await recargar()
      }
    } catch (err) {
      setAviso({ tono: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar.' })
    }
  }

  async function agregar(categoria: CategoriaOpcion) {
    if (!id || !nuevas[categoria].trim()) return
    try {
      const orden = (encuesta?.opciones.filter((o) => o.categoria === categoria).length ?? 0) + 1
      await agregarOpcion(id, categoria, nuevas[categoria], orden)
      setNuevas({ ...nuevas, [categoria]: '' })
      await recargar()
    } catch (err) {
      setAviso({ tono: 'error', texto: err instanceof Error ? err.message : 'No se pudo agregar la opción.' })
    }
  }

  async function quitar(opcionId: string, texto: string) {
    if (!window.confirm(`¿Quitar "${texto}"? Se borran también sus votos.`)) return
    try {
      await eliminarOpcion(opcionId)
      await recargar()
    } catch (err) {
      setAviso({ tono: 'error', texto: err instanceof Error ? err.message : 'No se pudo quitar.' })
    }
  }

  async function borrar() {
    if (!id || !window.confirm('¿Eliminar la encuesta con todas sus opciones y votos?')) return
    await eliminarEncuesta(id)
    navegar('/org')
  }

  return (
    <section aria-labelledby="titulo-editor-encuesta">
      <Link to="/org" className={`${boton.texto} -ml-1 text-sm`}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Panel
      </Link>
      <h1 id="titulo-editor-encuesta" className="mt-1 text-2xl font-bold tracking-[-0.02em] md:text-[28px]">
        {id ? 'Editar encuesta' : 'Nueva encuesta'}
      </h1>
      {id && <p className="num mt-1 text-[15px] text-muted">{totalVotantes} {totalVotantes === 1 ? 'persona votó' : 'personas votaron'}</p>}

      {aviso && <div className="mt-4"><Mensaje tono={aviso.tono}>{aviso.texto}</Mensaje></div>}

      <form onSubmit={guardar} className={`${tarjeta} mt-6 grid gap-5 p-4 sm:grid-cols-2 md:p-6`}>
        <div className="sm:col-span-2">
          <label htmlFor="e-titulo" className={campo.etiqueta}>Pregunta</label>
          <input id="e-titulo" required className={campo.input} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div>
          <label htmlFor="e-max" className={campo.etiqueta}>Máximo de opciones por categoría</label>
          <input id="e-max" type="number" min={1} required className={`${campo.input} num`} value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="e-cierra" className={campo.etiqueta}>Cierra (opcional, hora de Lima)</label>
          <input id="e-cierra" type="datetime-local" className={campo.input} value={cierra} onChange={(e) => setCierra(e.target.value)} />
        </div>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={abierta} onChange={(e) => setAbierta(e.target.checked)} />
          <span className="text-[15px]">Abierta (si la cierras, el público solo ve resultados)</span>
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" className={boton.primario}>{id ? 'Guardar cambios' : 'Crear y agregar opciones'}</button>
          {id && <button type="button" onClick={borrar} className={`${boton.secundario} text-negative`}>Eliminar encuesta</button>}
        </div>
      </form>

      {id && encuesta && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ordenCategorias.map((categoria) => {
            const opciones = encuesta.opciones.filter((o) => o.categoria === categoria)
            return (
              <section key={categoria} aria-labelledby={`cat-${categoria}`} className={`${tarjeta} p-4`}>
                <h2 id={`cat-${categoria}`} className="font-semibold">{etiquetaCategoria[categoria]}</h2>
                <ul className="mt-2 divide-y divide-rule">
                  {opciones.map((o) => {
                    const votos = datos?.resultados.find((r) => r.opcion_id === o.id)?.votos ?? 0
                    return (
                      <li key={o.id} className="flex items-center gap-2 py-1.5">
                        <span className="min-w-0 flex-1 text-[15px]">{o.texto}</span>
                        <span className="num text-[13px] text-muted">{votos}</span>
                        <button type="button" onClick={() => quitar(o.id, o.texto)} className="inline-flex size-11 items-center justify-center rounded-[6px] text-muted hover:bg-raised hover:text-negative" aria-label={`Quitar ${o.texto}`}>
                          <X aria-hidden="true" className="size-4" />
                        </button>
                      </li>
                    )
                  })}
                  {opciones.length === 0 && <li className="py-2 text-[15px] text-muted">Sin opciones.</li>}
                </ul>
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void agregar(categoria)
                  }}
                >
                  <label htmlFor={`nueva-${categoria}`} className="sr-only">Nueva opción en {etiquetaCategoria[categoria]}</label>
                  <input id={`nueva-${categoria}`} placeholder="Nueva opción" className={`${campo.input} mt-0`} value={nuevas[categoria]} onChange={(e) => setNuevas({ ...nuevas, [categoria]: e.target.value })} />
                  <button type="submit" className={`${boton.secundario} flex-none`}>Agregar</button>
                </form>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}
