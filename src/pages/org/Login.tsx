import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { boton, campo, tarjeta } from '../../components/estilos'
import { Mensaje } from '../../components/Mensaje'
import { Pinguino } from '../../components/Pinguino'
import { useSesion } from '../../hooks/useSesion'
import { cerrarSesion, iniciarSesionOrganizador } from '../../lib/api'

export default function Login() {
  const { sesion, perfil } = useSesion()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const volver = params.get('volver')?.startsWith('/org') ? params.get('volver')! : '/org'

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión de organizador, directo al panel.
  if (sesion && !sesion.user.is_anonymous) return <Navigate to={volver} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const ok = await iniciarSesionOrganizador(correo, contrasena)
      if (!ok) {
        // Credenciales válidas pero no está en la tabla organizadores.
        await cerrarSesion()
        setError('Acceso solo para organizadores. Tu cuenta no está registrada como organizadora.')
        return
      }
      navegar(volver, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-login" className="mx-auto max-w-md">
      <Pinguino className="mx-auto mb-2 w-24" variante="cuaderno" />
      <h1 id="titulo-login" className="text-2xl font-bold tracking-[-0.02em]">
        Panel del organizador
      </h1>
      <p className="mt-2 text-[15px] text-muted">Acceso solo para organizadores de la AAII y delegados.</p>

      {perfil && (
        <div className="mt-4">
          <Mensaje tono="info">
            Este navegador está registrado como participante ({perfil.alias}). Si inicias sesión aquí, ese registro se
            pierde en este navegador. Usa otro navegador o una ventana privada.
          </Mensaje>
        </div>
      )}

      <form onSubmit={enviar} className={`${tarjeta} mt-6 space-y-5 p-4 md:p-6`}>
        <div>
          <label htmlFor="correo-org" className={campo.etiqueta}>Correo</label>
          <input id="correo-org" type="email" autoComplete="username" required className={campo.input} value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div>
          <label htmlFor="contrasena-org" className={campo.etiqueta}>Contraseña</label>
          <input id="contrasena-org" type="password" autoComplete="current-password" required className={campo.input} value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </div>
        {error && <Mensaje tono="error">{error}</Mensaje>}
        <button type="submit" disabled={enviando} className={`${boton.primario} w-full`}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
