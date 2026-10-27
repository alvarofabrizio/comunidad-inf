import { Link, useLocation } from 'react-router-dom'
import { boton } from './estilos'

/** Invitación a registrarse que vuelve a la misma página al terminar. */
export function RequiereRegistro({ accion }: { accion: string }) {
  const { pathname } = useLocation()
  return (
    <div className="rounded-[8px] bg-accent-soft p-4">
      <p className="text-[15px] text-accent-ink">
        Para {accion} necesitas registrarte. Toma un minuto y no pide contraseña.
      </p>
      <Link
        to={`/registro?volver=${encodeURIComponent(pathname)}`}
        className={`${boton.primario} mt-3 w-full sm:w-auto`}
      >
        Registrarme
      </Link>
    </div>
  )
}
