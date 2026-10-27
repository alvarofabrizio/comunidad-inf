import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CampoContrasena } from '../components/CampoContrasena'
import { boton, campo, tarjeta } from '../components/estilos'
import { ClickSpark } from '../components/ClickSpark'
import { Mensaje } from '../components/Mensaje'
import { Pinguino } from '../components/Pinguino'
import { useSesion } from '../hooks/useSesion'
import { cerrarSesion, eliminarMiPerfil, protegerCuenta, registrarParticipante, tipoDeCuenta } from '../lib/api'

const ESPECIALIDADES = ['Ingeniería Informática', 'Otra especialidad']

type Errores = Partial<Record<'nombre' | 'alias' | 'correo' | 'codigo' | 'contrasena' | 'consentimiento', string>>

// Mismas reglas que los CHECK de 0001_esquema.sql, para avisar antes de enviar.
function validar(
  d: { nombre: string; alias: string; correo: string; codigo: string; contrasena: string; consentimiento: boolean },
  pideContrasena: boolean,
): Errores {
  const errores: Errores = {}
  if (d.nombre.trim().length < 2) errores.nombre = 'Escribe tu nombre (al menos 2 letras).'
  const alias = d.alias.trim()
  if (alias.length < 3 || alias.length > 20) errores.alias = 'El alias debe tener entre 3 y 20 caracteres.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo.trim())) errores.correo = 'Escribe un correo válido, por ejemplo nombre@pucp.edu.pe.'
  if (d.codigo.trim() && !/^\d{8}$/.test(d.codigo.trim())) errores.codigo = 'El código PUCP tiene 8 dígitos.'
  if (pideContrasena && d.contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.'
  if (!d.consentimiento) errores.consentimiento = 'Necesitamos tu consentimiento para guardar tus datos.'
  return errores
}

/** Solo rutas internas: evita redirigir a otro sitio con ?volver=https://... */
export function destinoSeguro(volver: string | null): string {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/'
}

export default function Registro() {
  const { sesion, perfil, recargarPerfil, cargando } = useSesion()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const volver = destinoSeguro(params.get('volver'))
  const tipo = tipoDeCuenta(sesion)

  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')
  const [correo, setCorreo] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0])
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarBaja, setConfirmarBaja] = useState(false)

  // Con una cuenta ya abierta (por ejemplo, un organizador) se usa su correo y no se pide contraseña.
  const correoFijo = tipo === 'cuenta' ? sesion?.user.email ?? '' : ''
  const pideContrasena = tipo !== 'cuenta'

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErrorGeneral(null)
    const correoFinal = correoFijo || correo
    const nuevos = validar({ nombre, alias, correo: correoFinal, codigo, contrasena, consentimiento }, pideContrasena)
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
    setEnviando(true)
    try {
      await registrarParticipante({ nombre, alias, correo: correoFinal, especialidad, codigo_pucp: codigo, consentimiento, contrasena })
      await recargarPerfil()
      navegar(volver, { replace: true })
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo completar el registro.'
      // Los errores se muestran junto al campo que los causa.
      if (mensaje.includes('cuenta con este correo') || mensaje.includes('correo no es válido')) setErrores({ correo: mensaje })
      else if (mensaje.includes('alias')) setErrores({ alias: mensaje })
      else if (mensaje.includes('contraseña')) setErrores({ contrasena: mensaje })
      else setErrorGeneral(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  async function proteger(e: FormEvent) {
    e.preventDefault()
    if (!perfil) return
    setErrorGeneral(null)
    if (contrasena.length < 8) {
      setErrores({ contrasena: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }
    setEnviando(true)
    try {
      await protegerCuenta(perfil.correo, contrasena)
      setErrores({})
      setContrasena('')
      setExito(`Listo: ya puedes ingresar desde cualquier dispositivo con ${perfil.correo} y tu contraseña.`)
    } catch (err) {
      setErrores({ contrasena: err instanceof Error ? err.message : 'No se pudo proteger la cuenta.' })
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

  // ------------------------------------------------------------------ perfil
  if (perfil) {
    return (
      <section aria-labelledby="titulo-perfil">
        <h1 id="titulo-perfil" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
          Tu perfil
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {tipo === 'cuenta'
            ? `Ingresaste con ${sesion?.user.email}. Los demás solo ven tu alias.`
            : 'Los demás solo ven tu alias.'}
        </p>
        {exito && <div className="mt-4"><Mensaje tono="exito">{exito}</Mensaje></div>}

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

        {/* Registros antiguos (sesión anónima): ponerle contraseña a la misma cuenta. */}
        {tipo === 'anonima' && (
          <form onSubmit={proteger} className="mt-6 rounded-[8px] bg-warning-bg p-4">
            <h2 className="text-lg font-semibold text-warning-ink">Protege tu cuenta</h2>
            <p className="mt-1 text-[15px] text-warning-ink">
              Tu registro solo vive en este navegador. Crea una contraseña para ingresar desde otro celular o computadora
              con <strong className="font-semibold">{perfil.correo}</strong>. Tus votos e inscripciones se mantienen.
            </p>
            <div className="mt-3">
              <CampoContrasena id="contrasena-nueva" etiqueta="Nueva contraseña" valor={contrasena} alCambiar={setContrasena} nueva error={errores.contrasena} ayuda="Al menos 8 caracteres." />
            </div>
            <button type="submit" disabled={enviando} className={`${boton.primario} mt-3 w-full sm:w-auto`}>
              {enviando ? 'Guardando…' : 'Crear mi contraseña'}
            </button>
          </form>
        )}

        {tipo === 'cuenta' && (
          <div className="mt-6">
            <button type="button" onClick={() => void cerrarSesion().then(() => navegar('/'))} className={boton.secundario}>
              Cerrar sesión
            </button>
            <p className="mt-2 text-[13px] text-muted">Puedes volver a ingresar cuando quieras con tu correo y contraseña.</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Borrar mis datos</h2>
          <p className="mt-1 text-[15px] text-muted">
            Se eliminan tu perfil, tus votos, tus inscripciones y tu cuenta de acceso, y se cierra la sesión.
          </p>
          {errorGeneral && <div className="mt-3"><Mensaje tono="error">{errorGeneral}</Mensaje></div>}
          {confirmarBaja ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={darseDeBaja} disabled={enviando} className={`${boton.secundario} border-negative text-negative`}>
                Sí, borrar los datos de {perfil.alias}
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

  // ---------------------------------------------------------------- registro
  const descr = (id: string, extra?: string) => [extra, errores[id as keyof Errores] ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <section aria-labelledby="titulo-registro">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 id="titulo-registro" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
            Crea tu cuenta
          </h1>
          <p className="mt-2 max-w-prose text-[15px] text-muted">
            Con tu correo y una contraseña puedes votar, inscribirte y sumar puntos, y entrar desde cualquier celular o
            computadora.
          </p>
        </div>
        <Pinguino className="w-20 flex-none md:w-24" variante="cuaderno" />
      </div>

      {tipo === 'ninguna' && (
        <p className="mt-4 text-[15px]">
          ¿Ya tienes cuenta?{' '}
          <Link to={`/ingresar?volver=${encodeURIComponent(volver)}`} className="font-medium text-accent underline underline-offset-2">
            Ingresa aquí
          </Link>
        </p>
      )}

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
            id="correo" name="correo" type="email" inputMode="email" autoComplete={pideContrasena ? 'username' : 'email'} className={campo.input}
            value={correoFijo || correo} readOnly={!!correoFijo}
            onChange={(e) => setCorreo(e.target.value)} aria-invalid={!!errores.correo} aria-describedby={descr('correo', 'correo-ayuda')}
          />
          <p id="correo-ayuda" className={campo.ayuda}>
            {correoFijo
              ? 'Se usa el correo de la cuenta con la que ingresaste.'
              : 'Con este correo ingresarás. Solo lo ven los organizadores; un correo, una cuenta.'}
          </p>
          {errores.correo && (
            <p id="correo-error" className={campo.error}>
              {errores.correo}{' '}
              {errores.correo.includes('Ingresa') && (
                <Link to={`/ingresar?volver=${encodeURIComponent(volver)}`} className="underline underline-offset-2">Ir a ingresar</Link>
              )}
            </p>
          )}
        </div>

        {pideContrasena && (
          <CampoContrasena id="contrasena" etiqueta="Contraseña" valor={contrasena} alCambiar={setContrasena} nueva error={errores.contrasena} ayuda="Al menos 8 caracteres. La necesitarás para entrar desde otro dispositivo." />
        )}

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
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </ClickSpark>
      </form>
    </section>
  )
}
