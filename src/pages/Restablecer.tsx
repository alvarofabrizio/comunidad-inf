import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CampoContrasena } from '../components/CampoContrasena'
import { boton, tarjeta } from '../components/estilos'
import { Mensaje } from '../components/Mensaje'
import { useSesion } from '../hooks/useSesion'
import { cambiarContrasena, escucharRecuperacion, tipoDeCuenta } from '../lib/api'

// Destino del enlace "Olvidé mi contraseña". supabase-js lee el token del enlace,
// abre la sesión de esa cuenta y avisa con el evento PASSWORD_RECOVERY.
// Aquí la persona escribe su contraseña nueva.
export default function Restablecer() {
  const { sesion, cargando } = useSesion()
  const navegar = useNavigate()
  const [desdeCorreo, setDesdeCorreo] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => escucharRecuperacion(() => setDesdeCorreo(true)), [])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await cambiarContrasena(contrasena)
      navegar('/registro', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  const puede = desdeCorreo || tipoDeCuenta(sesion) === 'cuenta'

  return (
    <section aria-labelledby="titulo-restablecer" className="mx-auto max-w-md">
      <h1 id="titulo-restablecer" className="text-2xl font-bold tracking-[-0.02em]">Contraseña nueva</h1>
      {cargando ? null : puede ? (
        <form onSubmit={guardar} className={`${tarjeta} mt-6 space-y-5 p-4 md:p-6`}>
          <p className="text-[15px] text-muted">Cuenta: {sesion?.user.email}</p>
          <CampoContrasena id="contrasena-restablecer" etiqueta="Contraseña nueva" valor={contrasena} alCambiar={setContrasena} nueva ayuda="Al menos 8 caracteres." />
          {error && <Mensaje tono="error">{error}</Mensaje>}
          <button type="submit" disabled={enviando} className={`${boton.primario} w-full`}>
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      ) : (
        <div className="mt-4">
          <Mensaje tono="info">
            El enlace no es válido o ya venció. <Link to="/ingresar" className="font-semibold underline">Pide uno nuevo</Link> desde “¿Olvidaste tu contraseña?”.
          </Mensaje>
        </div>
      )}
    </section>
  )
}
