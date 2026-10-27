import { UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../hooks/useSesion'
import { Logotipo } from './Marca'
import { destinos, NavInferior } from './NavInferior'
import { Pie } from './Pie'

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
      {/* Cabecera en bosque con el logotipo: la identidad verde de Informática. */}
      <header className="zona-oscura sticky top-0 z-20 bg-bosque">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Link to="/" aria-label="Comunidad INF, inicio" className="rounded-[6px]">
            <Logotipo />
          </Link>
          <nav aria-label="Principal" className="ml-2 hidden md:block">
            <ul className="flex gap-1">
              {destinos.map(({ a, texto }) => (
                <li key={a}>
                  <NavLink
                    to={a}
                    end={a === '/'}
                    className={({ isActive }) =>
                      `rounded-[6px] px-3 py-2 text-[15px] font-medium transition-colors ${
                        isActive ? 'bg-bosque-2 text-lima' : 'text-crema-tenue hover:text-crema'
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
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium text-crema hover:bg-bosque-2"
                  aria-label={`Tu perfil: ${perfil.alias}`}
                >
                  <UserRound aria-hidden="true" className="size-4 text-lima" />
                  <span className="max-w-[9rem] truncate">{perfil.alias}</span>
                </Link>
              ) : pathname === '/registro' ? null : (
                <Link
                  to={`/registro?volver=${encodeURIComponent(pathname)}`}
                  className="inline-flex min-h-10 items-center rounded-[6px] bg-lima px-3 text-[15px] font-semibold text-bosque transition-transform hover:brightness-105 active:scale-[0.98]"
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
      <div className="pb-nav mt-16 bg-bosque md:pb-0">
        <Pie />
      </div>
      <NavInferior />
    </div>
  )
}
