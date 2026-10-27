import { UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../hooks/useSesion'
import { destinos, NavInferior } from './NavInferior'
import { Pie } from './Pie'

/** Marca: tres asientos de un equipo, dos ocupados y uno libre para ti. */
function Marca() {
  return (
    <svg viewBox="0 0 32 32" className="size-7 flex-none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--color-accent)" />
      <circle cx="9" cy="16" r="3" fill="#fff" />
      <circle cx="16" cy="16" r="3" fill="#fff" />
      <circle cx="23" cy="16" r="3" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

export function Layout() {
  const { perfil, cargando } = useSesion()
  const { pathname } = useLocation()

  // Al cambiar de página, volver arriba (como una navegación normal).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only z-30 rounded-[6px] bg-accent px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-ground">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em] text-ink">
            <Marca />
            Comunidad INF
          </Link>
          <nav aria-label="Principal" className="ml-4 hidden md:block">
            <ul className="flex gap-1">
              {destinos.map(({ a, texto }) => (
                <li key={a}>
                  <NavLink
                    to={a}
                    end={a === '/'}
                    className={({ isActive }) =>
                      `rounded-[6px] px-3 py-2 text-[15px] font-medium transition-colors ${
                        isActive ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink'
                      }`
                    }
                  >
                    {texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto">
            {!cargando &&
              (perfil ? (
                <Link
                  to="/registro"
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium text-ink hover:bg-raised"
                  aria-label={`Tu perfil: ${perfil.alias}`}
                >
                  <UserRound aria-hidden="true" className="size-4 text-muted" />
                  <span className="max-w-[9rem] truncate">{perfil.alias}</span>
                </Link>
              ) : pathname === '/registro' ? null : (
                <Link
                  to={`/registro?volver=${encodeURIComponent(pathname)}`}
                  className="inline-flex min-h-10 items-center rounded-[6px] bg-accent px-3 text-[15px] font-semibold text-white hover:bg-accent-hover"
                >
                  Registrarme
                </Link>
              ))}
          </div>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-4">
        <Outlet />
      </main>
      <div className="pb-nav md:pb-0">
        <Pie />
      </div>
      <NavInferior />
    </div>
  )
}
