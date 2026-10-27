import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { boton, campo, tarjeta } from '../components/estilos'
import { ClickSpark } from '../components/ClickSpark'
import { Mensaje } from '../components/Mensaje'
import { useSesion } from '../hooks/useSesion'
import { eliminarMiPerfil, registrarParticipante } from '../lib/api'

const ESPECIALIDADES = ['Ingeniería Informática', 'Otra especialidad']

type Errores = Partial<Record<'nombre' | 'alias' | 'correo' | 'codigo' | 'consentimiento', string>>

// Mismas reglas que los CHECK de 0001_esquema.sql, para avisar antes de enviar.
function validar(d: { nombre: string; alias: string; correo: string; codigo: string; consentimiento: boolean }): Errores {
  const errores: Errores = {}
  if (d.nombre.trim().length < 2) errores.nombre = 'Escribe tu nombre (al menos 2 letras).'
  const alias = d.alias.trim()
  if (alias.length < 3 || alias.length > 20) errores.alias = 'El alias debe tener entre 3 y 20 caracteres.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo.trim())) errores.correo = 'Escribe un correo válido, por ejemplo nombre@pucp.edu.pe.'
  if (d.codigo.trim() && !/^\d{8}$/.test(d.codigo.trim())) errores.codigo = 'El código PUCP tiene 8 dígitos.'
  if (!d.consentimiento) errores.consentimiento = 'Necesitamos tu consentimiento para guardar tus datos.'
  return errores
}

/** Solo rutas internas: evita redirigir a otro sitio con ?volver=https://... */
function destinoSeguro(volver: string | null): string {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/'
}

export default function Registro() {
  const { perfil, recargarPerfil, cargando } = useSesion()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const volver = destinoSeguro(params.get('volver'))

  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')
  const [correo, setCorreo] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0])
  const [codigo, setCodigo] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarBaja, setConfirmarBaja] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErrorGeneral(null)
    const nuevos = validar({ nombre, alias, correo, codigo, consentimiento })
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
    setEnviando(true)
    try {
      await registrarParticipante({ nombre, alias, correo, especialidad, codigo_pucp: codigo, consentimiento })
      await recargarPerfil()
      navegar(volver, { replace: true })
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo completar el registro.'
      // Los duplicados se muestran junto al campo que los causa.
      if (mensaje.includes('correo ya está registrado')) setErrores({ correo: mensaje })
      else if (mensaje.includes('alias')) setErrores({ alias: mensaje })
      else setErrorGeneral(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  async function darseDeBaja() {
    setEnviando(true)
    try {
      await eliminarMiPerfil()
      navegar('/', { replace: true })
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'No se pudieron borrar tus datos.')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return null

  if (perfil) {
    return (
      <section aria-labelledby="titulo-perfil">
        <h1 id="titulo-perfil" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
          Tu perfil
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Quedaste registrado en este navegador. Los demás solo ven tu alias.
        </p>
        <dl className={`${tarjeta} mt-6 divide-y divide-rule`}>
          {[
            ['Alias público', perfil.alias],
            ['Nombre', perfil.nombre],
            ['Correo (solo organizadores)', perfil.correo],
            ['Especialidad', perfil.especialidad],
            ['Código PUCP', perfil.codigo_pucp ?? '—'],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-3">
              <dt className="text-sm text-muted">{etiqueta}</dt>
              <dd className="text-[15px] font-medium break-all text-ink">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Borrar mis datos</h2>
          <p className="mt-1 text-[15px] text-muted">
            Se elimina tu perfil con tus votos e inscripciones, y se cierra la sesión en este navegador.
          </p>
          {errorGeneral && <div className="mt-3"><Mensaje tono="error">{errorGeneral}</Mensaje></div>}
          {confirmarBaja ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={darseDeBaja} disabled={enviando} className={`${boton.secundario} border-negative text-negative`}>
                Sí, borrar el perfil de {perfil.alias}
              </button>
              <button type="button" onClick={() => setConfirmarBaja(false)} className={boton.secundario}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmarBaja(true)} className={`${boton.secundario} mt-3 text-negative`}>
              Borrar mis datos
            </button>
          )}
        </div>
      </section>
    )
  }

  const descr = (id: string, extra?: string) => [extra, errores[id as keyof Errores] ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <section aria-labelledby="titulo-registro">
      <h1 id="titulo-registro" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Regístrate para participar
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-muted">
        Sin contraseña: tu registro queda guardado en este celular y navegador. Con él puedes votar, inscribirte y
        sumar puntos.
      </p>

      <form onSubmit={enviar} noValidate className={`${tarjeta} mt-6 space-y-5 p-4 md:p-6`}>
        <div>
          <label htmlFor="nombre" className={campo.etiqueta}>Nombre</label>
          <input
            id="nombre" name="nombre" autoComplete="name" className={campo.input} value={nombre}
            onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} aria-describedby={descr('nombre')}
          />
          {errores.nombre && <p id="nombre-error" className={campo.error}>{errores.nombre}</p>}
        </div>

        <div>
          <label htmlFor="alias" className={campo.etiqueta}>Alias público</label>
          <input
            id="alias" name="alias" autoComplete="nickname" maxLength={20} className={campo.input} value={alias}
            onChange={(e) => setAlias(e.target.value)} aria-invalid={!!errores.alias} aria-describedby={descr('alias', 'alias-ayuda')}
          />
          <p id="alias-ayuda" className={campo.ayuda}>Es lo único que verán los demás, por ejemplo en el ranking. De 3 a 20 caracteres.</p>
          {errores.alias && <p id="alias-error" className={campo.error}>{errores.alias}</p>}
        </div>

        <div>
          <label htmlFor="correo" className={campo.etiqueta}>Correo</label>
          <input
            id="correo" name="correo" type="email" inputMode="email" autoComplete="email" className={campo.input} value={correo}
            onChange={(e) => setCorreo(e.target.value)} aria-invalid={!!errores.correo} aria-describedby={descr('correo', 'correo-ayuda')}
          />
          <p id="correo-ayuda" className={campo.ayuda}>Solo lo ven los organizadores. Un correo, un perfil.</p>
          {errores.correo && <p id="correo-error" className={campo.error}>{errores.correo}</p>}
        </div>

        <div>
          <label htmlFor="especialidad" className={campo.etiqueta}>Especialidad</label>
          <select id="especialidad" className={campo.input} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
            {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="codigo" className={campo.etiqueta}>
            Código PUCP <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="codigo" name="codigo" inputMode="numeric" maxLength={8} className={campo.input} value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} aria-invalid={!!errores.codigo} aria-describedby={descr('codigo')}
          />
          {errores.codigo && <p id="codigo-error" className={campo.error}>{errores.codigo}</p>}
        </div>

        <div>
          <div className="flex items-start gap-3">
            <input
              id="consentimiento" type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)}
              className="mt-0.5 size-5 flex-none accent-[var(--color-accent)]"
              aria-invalid={!!errores.consentimiento} aria-describedby={descr('consentimiento')}
            />
            <label htmlFor="consentimiento" className="text-[15px] text-ink">
              Acepto que Comunidad INF guarde estos datos para organizar las actividades, según la{' '}
              <Link to="/privacidad" className="font-medium text-accent underline underline-offset-2">política de privacidad</Link>.
            </label>
          </div>
          {errores.consentimiento && <p id="consentimiento-error" className={campo.error}>{errores.consentimiento}</p>}
        </div>

        {errorGeneral && <Mensaje tono="error">{errorGeneral}</Mensaje>}

        <ClickSpark className="w-full">
          <button type="submit" disabled={enviando} className={`${boton.primario} w-full`}>
            {enviando ? 'Registrando…' : 'Registrarme'}
          </button>
        </ClickSpark>
      </form>
    </section>
  )
}
