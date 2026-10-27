import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../hooks/useSesion'
import { cerrarSesion } from '../lib/api'
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
      <header className="sticky top-0 z-20 border-b border-border bg-ground">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to="/org" className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em]">
            <svg viewBox="0 0 32 32" className="size-7 flex-none" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="var(--color-accent)" />
              <circle cx="9" cy="16" r="3" fill="#fff" />
              <circle cx="16" cy="16" r="3" fill="#fff" />
              <circle cx="23" cy="16" r="3" fill="none" stroke="#fff" strokeWidth="2" />
            </svg>
            Panel INF
          </Link>
          <Link to="/" className="hidden text-[15px] text-muted hover:text-ink sm:inline">
            Ver sitio público
          </Link>
          {conSesion && (
            <button
              type="button"
              onClick={async () => {
                await cerrarSesion()
                navegar('/org/login')
              }}
              className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[6px] px-2 text-[15px] font-medium text-muted hover:bg-raised hover:text-ink"
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
      <Pie />
    </div>
  )
}
