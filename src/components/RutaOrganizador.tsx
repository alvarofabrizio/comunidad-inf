import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../hooks/useSesion'
import { cerrarSesion, esOrganizador } from '../lib/api'
import { boton } from './estilos'
import { Esqueleto } from './Mensaje'

/**
 * Protege las rutas /org en el frontend.
 * Esto es solo comodidad para el usuario: la protección real está en la base
 * (RLS + es_organizador()). Aunque alguien se saltara esta pantalla, la base
 * rechazaría sus lecturas de correos y sus escrituras.
 */
export function RutaOrganizador() {
  const { sesion, cargando } = useSesion()
  const { pathname } = useLocation()
  const [permitido, setPermitido] = useState<boolean | null>(null)

  useEffect(() => {
    let activo = true
    setPermitido(null)
    if (!sesion || sesion.user.is_anonymous) {
      setPermitido(false)
      return
    }
    esOrganizador()
      .then((ok) => activo && setPermitido(ok))
      .catch(() => activo && setPermitido(false))
    return () => {
      activo = false
    }
  }, [sesion])

  if (cargando || permitido === null) return <Esqueleto filas={3} />

  // Sin sesión de correo y contraseña: al login, recordando a dónde quería ir.
  if (!sesion || sesion.user.is_anonymous) {
    return <Navigate to={`/org/login?volver=${encodeURIComponent(pathname)}`} replace />
  }

  if (!permitido) {
    return (
      <section className="max-w-prose">
        <h1 className="text-2xl font-bold">Acceso solo para organizadores</h1>
        <p className="mt-2 text-[15px] text-muted">
          Tu cuenta ({sesion.user.email}) no está registrada como organizadora. Si deberías tener acceso, pídele a la
          AAII que agregue tu usuario a la tabla de organizadores.
        </p>
        <button type="button" onClick={() => void cerrarSesion()} className={`${boton.secundario} mt-4`}>
          Cerrar sesión
        </button>
      </section>
    )
  }

  return <Outlet />
}
