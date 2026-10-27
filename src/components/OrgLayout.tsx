import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../hooks/useSesion'
import { cerrarSesion } from '../lib/api'
import { Logotipo } from './Marca'
import { Pie } from './Pie'

/** Marco del panel: barra con la marca, "Panel" y cerrar sesión. Sin barra inferior. */
export function OrgLayout() {
  const { sesion } = useSesion()
  const { pathname } = useLocation()
  const navegar = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const conSesion = sesion && !sesion.user.is_anonymous

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="zona-oscura sticky top-0 z-20 bg-bosque">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to="/org" aria-label="Panel INF, inicio del panel" className="rounded-[6px]">
            <Logotipo texto="Panel" />
          </Link>
          <Link to="/" className="hidden text-[15px] text-crema-tenue hover:text-crema sm:inline">
            Ver sitio público
          </Link>
          {conSesion && (
            <button
              type="button"
              onClick={async () => {
                await cerrarSesion()
                navegar('/org/login')
              }}
              className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[6px] px-2 text-[15px] font-medium text-crema-tenue hover:bg-bosque-2 hover:text-crema"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Salir
            </button>
          )}
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-4">
        <Outlet />
      </main>
      <div className="mt-16 bg-bosque">
        <Pie />
      </div>
    </div>
  )
}
