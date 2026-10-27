import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { boton, campo, tarjeta } from '../../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../../components/Mensaje'
import { useCarga } from '../../hooks/useCarga'
import { eliminarActividad, guardarActividad, listarTemporadas, obtenerActividad } from '../../lib/api'
import { etiquetaEstado, etiquetaModalidad, etiquetaTipo } from '../../lib/formato'
import type { ActividadEditable, EstadoActividad, Modalidad, TipoActividad } from '../../types'

// Perú no tiene horario de verano: la hora de Lima es siempre UTC-5.
// El campo datetime-local se interpreta como hora de Lima, venga de donde venga el navegador.
const aCampoLima = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 16)
const desdeCampoLima = (valor: string) => new Date(`${valor}:00-05:00`).toISOString()

const vacia = (temporadaId: string): ActividadEditable => ({
  temporada_id: temporadaId,
  titulo: '',
  tipo: 'videojuego',
  juego_o_disciplina: '',
  descripcion: '',
  fecha_hora: new Date(Date.now() + 7 * 86400_000).toISOString(),
  lugar: '',
  modalidad: 'presencial',
  cupo: 20,
  tamano_equipo: 1,
  requiere_mixto: false,
  puntos_participacion: 5,
  puntos_1: 10,
  puntos_2: 6,
  puntos_3: 4,
  estado: 'borrador',
})

export default function EditorActividad() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const { datos, error, cargando, recargar } = useCarga(
    async () => ({ temporadas: await listarTemporadas(), actividad: id ? await obtenerActividad(id) : null }),
    [id],
  )
  const [form, setForm] = useState<ActividadEditable | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!datos || form) return
    if (datos.actividad) {
      // Quitamos los campos que no son editables (id, cupos calculados).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, creado_en, inscritos, lugares_libres, en_bolsa, ...editable } = datos.actividad
      setForm(editable)
    } else {
      setForm(vacia(params.get('temporada') ?? datos.temporadas.find((t) => t.activa)?.id ?? datos.temporadas[0]?.id ?? ''))
    }
  }, [datos, form, params])

  if (cargando && !datos) return <Esqueleto filas={4} />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (id && !datos?.actividad) return <p className="text-[15px] text-muted">Actividad no encontrada.</p>
  if (!form) return null

  const cambiar = <K extends keyof ActividadEditable>(clave: K, valor: ActividadEditable[K]) => setForm({ ...form, [clave]: valor })
  const numero = (clave: keyof ActividadEditable, etiqueta: string, min = 0, ayuda?: string) => (
    <div>
      <label htmlFor={`a-${clave}`} className={campo.etiqueta}>{etiqueta}</label>
      <input id={`a-${clave}`} type="number" inputMode="numeric" min={min} required className={`${campo.input} num`} value={String(form[clave])} onChange={(e) => cambiar(clave, Number(e.target.value) as never)} />
      {ayuda && <p className={campo.ayuda}>{ayuda}</p>}
    </div>
  )

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setAviso(null)
    setGuardando(true)
    try {
      const guardada = await guardarActividad({
        ...form!,
        id,
        juego_o_disciplina: form!.juego_o_disciplina?.trim() || null,
        requiere_mixto: form!.tamano_equipo > 1 && form!.requiere_mixto,
      })
      navegar(`/org/actividad/${guardada.id}`)
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function borrar() {
    if (!id || !window.confirm('¿Eliminar esta actividad con sus equipos, inscripciones y resultados?')) return
    try {
      await eliminarActividad(id)
      navegar('/org')
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se pudo eliminar.')
    }
  }

  return (
    <section aria-labelledby="titulo-editor">
      <Link to={id ? `/org/actividad/${id}` : '/org'} className={`${boton.texto} -ml-1 text-sm`}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Volver
      </Link>
      <h1 id="titulo-editor" className="mt-1 text-2xl font-bold tracking-[-0.02em] md:text-[28px]">
        {id ? 'Editar actividad' : 'Nueva actividad'}
      </h1>

      <form onSubmit={guardar} className={`${tarjeta} mt-6 grid gap-5 p-4 sm:grid-cols-2 md:p-6`}>
        <div className="sm:col-span-2">
          <label htmlFor="a-titulo" className={campo.etiqueta}>Título</label>
          <input id="a-titulo" required className={campo.input} value={form.titulo} onChange={(e) => cambiar('titulo', e.target.value)} />
        </div>
        <div>
          <label htmlFor="a-temporada" className={campo.etiqueta}>Temporada</label>
          <select id="a-temporada" className={campo.input} value={form.temporada_id} onChange={(e) => cambiar('temporada_id', e.target.value)}>
            {datos?.temporadas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-estado" className={campo.etiqueta}>Estado</label>
          <select id="a-estado" className={campo.input} value={form.estado} onChange={(e) => cambiar('estado', e.target.value as EstadoActividad)}>
            {(Object.keys(etiquetaEstado) as EstadoActividad[]).map((k) => <option key={k} value={k}>{etiquetaEstado[k]}</option>)}
          </select>
          <p className={campo.ayuda}>En borrador no la ve el público.</p>
        </div>
        <div>
          <label htmlFor="a-tipo" className={campo.etiqueta}>Tipo</label>
          <select id="a-tipo" className={campo.input} value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoActividad)}>
            {(Object.keys(etiquetaTipo) as TipoActividad[]).map((k) => <option key={k} value={k}>{etiquetaTipo[k]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-juego" className={campo.etiqueta}>Juego o disciplina</label>
          <input id="a-juego" className={campo.input} value={form.juego_o_disciplina ?? ''} onChange={(e) => cambiar('juego_o_disciplina', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="a-descripcion" className={campo.etiqueta}>Descripción</label>
          <textarea id="a-descripcion" rows={3} className={`${campo.input} py-2`} value={form.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </div>
        <div>
          <label htmlFor="a-fecha" className={campo.etiqueta}>Fecha y hora (Lima)</label>
          <input id="a-fecha" type="datetime-local" required className={campo.input} value={aCampoLima(form.fecha_hora)} onChange={(e) => e.target.value && cambiar('fecha_hora', desdeCampoLima(e.target.value))} />
        </div>
        <div>
          <label htmlFor="a-modalidad" className={campo.etiqueta}>Modalidad</label>
          <select id="a-modalidad" className={campo.input} value={form.modalidad} onChange={(e) => cambiar('modalidad', e.target.value as Modalidad)}>
            {(Object.keys(etiquetaModalidad) as Modalidad[]).map((k) => <option key={k} value={k}>{etiquetaModalidad[k]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="a-lugar" className={campo.etiqueta}>Lugar</label>
          <input id="a-lugar" required className={campo.input} value={form.lugar} onChange={(e) => cambiar('lugar', e.target.value)} />
          <p className={campo.ayuda}>Si es virtual, el enlace o la plataforma.</p>
        </div>
        {numero('cupo', 'Cupo (personas)', 1, 'Incluye a quienes están en la bolsa.')}
        {numero('tamano_equipo', 'Tamaño de equipo', 1, '1 = individual.')}
        {form.tamano_equipo > 1 && (
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-accent)]" checked={form.requiere_mixto} onChange={(e) => cambiar('requiere_mixto', e.target.checked)} />
            <span className="text-[15px]">Exige equipo mixto (el capitán lo declara; no se pide el género de nadie)</span>
          </label>
        )}
        <fieldset className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4">
          <legend className="mb-2 text-sm font-medium">Puntos</legend>
          {numero('puntos_participacion', 'Por asistir')}
          {numero('puntos_1', '1.° puesto')}
          {numero('puntos_2', '2.° puesto')}
          {numero('puntos_3', '3.° puesto')}
        </fieldset>
        {aviso && <div className="sm:col-span-2"><Mensaje tono="error">{aviso}</Mensaje></div>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" disabled={guardando} className={boton.primario}>{guardando ? 'Guardando…' : 'Guardar actividad'}</button>
          {id && <button type="button" onClick={borrar} className={`${boton.secundario} text-negative`}>Eliminar</button>}
        </div>
      </form>
    </section>
  )
}
