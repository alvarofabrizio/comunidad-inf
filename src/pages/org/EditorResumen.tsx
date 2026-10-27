import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { boton, campo, tarjeta } from '../../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../../components/Mensaje'
import { useCarga } from '../../hooks/useCarga'
import {
  eliminarResumen,
  guardarResumen,
  listarEquiposOrg,
  listarInscripcionesOrg,
  listarResultados,
  obtenerActividad,
  obtenerResumen,
  subirImagenResumen,
} from '../../lib/api'

// Resumen de actividad (P1-3): texto corto, ganadores e imagen opcional.
// Regla ética: la imagen solo se publica si el organizador declara que las
// personas que aparecen autorizaron su publicación (Ley 29733). Sin la casilla,
// la imagen ni siquiera se sube a Storage.
export default function EditorResumen() {
  const { id = '' } = useParams()
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [actividad, resumen, resultados, equipos, inscripciones] = await Promise.all([
      obtenerActividad(id),
      obtenerResumen(id),
      listarResultados(id),
      listarEquiposOrg(id),
      listarInscripcionesOrg(id),
    ])
    // Ganadores sugeridos a partir de los resultados registrados (solo alias o nombre de equipo).
    const sugeridos = resultados
      .map((r) => {
        const quien = r.equipo_id
          ? equipos.find((e) => e.id === r.equipo_id)?.nombre
          : inscripciones.find((i) => i.participante_id === r.participante_id)?.participante.alias
        return `${r.posicion}.° ${quien ?? '—'}`
      })
      .join(' · ')
    return { actividad, resumen, sugeridos }
  }, [id])

  const [texto, setTexto] = useState('')
  const [ganadores, setGanadores] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [imagenActual, setImagenActual] = useState<string | null>(null)
  const [autorizada, setAutorizada] = useState(false)
  const [listo, setListo] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'exito' | 'error'; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!datos || listo) return
    setTexto(datos.resumen?.texto ?? '')
    setGanadores(datos.resumen?.ganadores ?? datos.sugeridos)
    setImagenActual(datos.resumen?.imagen_url ?? null)
    setAutorizada(datos.resumen?.imagen_autorizada ?? false)
    setListo(true)
  }, [datos, listo])

  if (cargando && !datos) return <Esqueleto filas={3} />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (!datos?.actividad) return <p className="text-[15px] text-muted">Actividad no encontrada.</p>

  const hayImagen = !!archivo || !!imagenActual
  const vistaPrevia = archivo ? URL.createObjectURL(archivo) : imagenActual

  async function publicar(e: FormEvent) {
    e.preventDefault()
    setAviso(null)
    if (hayImagen && !autorizada) {
      setAviso({ tono: 'error', texto: 'Sin la casilla de autorización la imagen no se publica. Márcala o quita la imagen.' })
      return
    }
    setGuardando(true)
    try {
      // Solo se sube a Storage después de comprobar la autorización.
      const url = archivo ? await subirImagenResumen(id, archivo) : imagenActual
      await guardarResumen({
        actividad_id: id,
        texto: texto.trim(),
        ganadores: ganadores.trim() || null,
        imagen_url: url,
        imagen_autorizada: url ? autorizada : false,
      })
      setArchivo(null)
      setImagenActual(url)
      setAviso({ tono: 'exito', texto: 'Resumen publicado.' })
    } catch (err) {
      setAviso({ tono: 'error', texto: err instanceof Error ? err.message : 'No se pudo publicar.' })
    } finally {
      setGuardando(false)
    }
  }

  async function despublicar() {
    if (!window.confirm('¿Quitar el resumen publicado?')) return
    await eliminarResumen(id)
    setTexto('')
    setImagenActual(null)
    setAviso({ tono: 'exito', texto: 'Resumen retirado.' })
  }

  return (
    <section aria-labelledby="titulo-resumen-org">
      <Link to={`/org/actividad/${id}`} className={`${boton.texto} -ml-1 text-sm`}>
        <ArrowLeft aria-hidden="true" className="size-4" /> {datos.actividad.titulo}
      </Link>
      <h1 id="titulo-resumen-org" className="mt-1 text-2xl font-bold tracking-[-0.02em] md:text-[28px]">
        Resumen de la actividad
      </h1>
      <p className="mt-1 text-[15px] text-muted">Se publica en la página de resúmenes y en la de la actividad.</p>

      <form onSubmit={publicar} className={`${tarjeta} mt-6 space-y-5 p-4 md:p-6`}>
        <div>
          <label htmlFor="r-texto" className={campo.etiqueta}>Qué pasó</label>
          <textarea id="r-texto" required rows={4} maxLength={600} className={`${campo.input} py-2`} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <p className={campo.ayuda}>Un texto corto: cuántos fueron, qué se jugó, algo que valga la pena contar. Máximo 600 caracteres.</p>
        </div>
        <div>
          <label htmlFor="r-ganadores" className={campo.etiqueta}>Ganadores</label>
          <input id="r-ganadores" className={campo.input} value={ganadores} onChange={(e) => setGanadores(e.target.value)} />
          <p className={campo.ayuda}>Sugerido a partir de los resultados registrados. Usa alias o nombres de equipo, no correos.</p>
        </div>
        <div>
          <label htmlFor="r-imagen" className={campo.etiqueta}>
            Foto <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="r-imagen"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-[15px] file:mr-3 file:min-h-11 file:rounded-[6px] file:border file:border-control file:bg-surface file:px-4 file:font-medium"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            aria-describedby="r-imagen-ayuda"
          />
          <p id="r-imagen-ayuda" className={campo.ayuda}>JPG, PNG o WebP de hasta 5 MB.</p>
          {vistaPrevia && (
            <div className="mt-3 flex items-start gap-3">
              <img src={vistaPrevia} alt="Vista previa de la foto" className="h-24 w-36 rounded-[6px] object-cover" />
              <button
                type="button"
                className={`${boton.texto} text-sm text-negative`}
                onClick={() => {
                  setArchivo(null)
                  setImagenActual(null)
                  setAutorizada(false)
                }}
              >
                Quitar foto
              </button>
            </div>
          )}
        </div>
        {hayImagen && (
          <div className="rounded-[8px] bg-warning-bg p-3">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={autorizada} onChange={(e) => setAutorizada(e.target.checked)} className="mt-0.5 size-5 flex-none accent-[var(--color-accent)]" />
              <span className="text-[15px] text-warning-ink">
                <strong className="font-semibold">Las personas que aparecen autorizaron su publicación.</strong> Sin esta casilla la foto no se publica (Ley N.° 29733).
              </span>
            </label>
          </div>
        )}
        {aviso && <Mensaje tono={aviso.tono}>{aviso.texto}</Mensaje>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={guardando} className={boton.primario}>{guardando ? 'Publicando…' : 'Publicar resumen'}</button>
          {datos.resumen && <button type="button" onClick={despublicar} className={`${boton.secundario} text-negative`}>Retirar resumen</button>}
        </div>
      </form>
    </section>
  )
}
