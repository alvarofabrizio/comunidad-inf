import { Link, useLocation } from 'react-router-dom'
import { boton } from './estilos'

/** Invitación a crear cuenta o ingresar; al terminar vuelve a la misma página. */
export function RequiereRegistro({ accion }: { accion: string }) {
  const { pathname } = useLocation()
  const volver = encodeURIComponent(pathname)
  return (
    <div className="rounded-[8px] bg-accent-soft p-4">
      <p className="text-[15px] text-accent-ink">
        Para {accion} necesitas una cuenta. Créala en un minuto o ingresa si ya tienes una.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/registro?volver=${volver}`} className={`${boton.primario} flex-1 sm:flex-none`}>
          Crear cuenta
        </Link>
        <Link to={`/ingresar?volver=${volver}`} className={`${boton.secundario} flex-1 sm:flex-none`}>
          Ingresar
        </Link>
      </div>
    </div>
  )
}
