import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CampoContrasena } from '../components/CampoContrasena'
import { boton, campo, tarjeta } from '../components/estilos'
import { ClickSpark } from '../components/ClickSpark'
import { Mensaje } from '../components/Mensaje'
import { Pinguino } from '../components/Pinguino'
import { useSesion } from '../hooks/useSesion'
import { enviarRecuperacion, iniciarSesion, tipoDeCuenta } from '../lib/api'
import { destinoSeguro } from './Registro'

// Ingresar con correo y contraseña: la misma cuenta funciona en cualquier dispositivo.
export default function Ingresar() {
  const { sesion, perfil, recargarPerfil, cargando } = useSesion()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const volver = destinoSeguro(params.get('volver'))

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [olvido, setOlvido] = useState(false)

  if (cargando) return null
  // Si ya hay una cuenta con perfil abierta, no tiene sentido volver a ingresar.
  if (perfil && tipoDeCuenta(sesion) === 'cuenta') return <Navigate to={volver} replace />

  async function ingresar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(correo, contrasena)
      await recargarPerfil()
      // Una cuenta sin perfil (por ejemplo, borró sus datos o es solo organizador) completa el registro.
      navegar(volver, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ingresar.')
    } finally {
      setEnviando(false)
    }
  }

  async function recuperar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())) {
      setError('Escribe el correo de tu cuenta.')
      return
    }
    setEnviando(true)
    try {
      await enviarRecuperacion(correo)
      setAviso(`Si ${correo.trim()} tiene una cuenta, te llegará un correo con un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-ingresar" className="mx-auto max-w-md">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 id="titulo-ingresar" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
            {olvido ? 'Recupera tu contraseña' : 'Ingresar'}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {olvido ? 'Te enviaremos un enlace a tu correo.' : 'Entra con el correo y la contraseña de tu cuenta.'}
          </p>
        </div>
        <Pinguino className="w-16 flex-none" variante="cuaderno" />
      </div>

      {tipoDeCuenta(sesion) === 'anonima' && perfil && (
        <div className="mt-4">
          <Mensaje tono="info">
            Este navegador tiene el registro de {perfil.alias} sin contraseña. Antes de ingresar con otra cuenta,{' '}
            <Link to="/registro" className="font-semibold underline">protégelo con una contraseña</Link> o lo perderás.
          </Mensaje>
        </div>
      )}

      <form onSubmit={olvido ? recuperar : ingresar} className={`${tarjeta} mt-6 space-y-5 p-4 md:p-6`}>
        <div>
          <label htmlFor="correo-ingreso" className={campo.etiqueta}>Correo</label>
          <input id="correo-ingreso" type="email" inputMode="email" autoComplete="username" required className={campo.input} value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        {!olvido && <CampoContrasena id="contrasena-ingreso" etiqueta="Contraseña" valor={contrasena} alCambiar={setContrasena} />}
        {error && <Mensaje tono="error">{error}</Mensaje>}
        {aviso && <Mensaje tono="exito">{aviso}</Mensaje>}
        <ClickSpark className="w-full">
          <button type="submit" disabled={enviando} className={`${boton.primario} w-full`}>
            {olvido ? (enviando ? 'Enviando…' : 'Enviar enlace') : enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </ClickSpark>
        <button
          type="button"
          onClick={() => {
            setOlvido((v) => !v)
            setError(null)
            setAviso(null)
          }}
          className={`${boton.texto} text-sm`}
        >
          {olvido ? 'Volver a ingresar' : '¿Olvidaste tu contraseña?'}
        </button>
      </form>

      <p className="mt-4 text-[15px]">
        ¿No tienes cuenta?{' '}
        <Link to={`/registro?volver=${encodeURIComponent(volver)}`} className="font-medium text-accent underline underline-offset-2">
          Créala en un minuto
        </Link>
      </p>
    </section>
  )
}
