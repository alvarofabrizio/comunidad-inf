import { CalendarDays, Home, Trophy, Vote, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export const destinos: { a: string; texto: string; Icono: LucideIcon }[] = [
  { a: '/', texto: 'Inicio', Icono: Home },
  { a: '/calendario', texto: 'Calendario', Icono: CalendarDays },
  { a: '/encuesta', texto: 'Encuesta', Icono: Vote },
  { a: '/ranking', texto: 'Ranking', Icono: Trophy },
]

/** Barra inferior del celular, en bosque: cuatro destinos con ícono y texto (nunca solo ícono). */
export function NavInferior() {
  return (
    <nav aria-label="Principal" className="zona-oscura safe-bottom fixed inset-x-0 bottom-0 z-20 bg-bosque md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {destinos.map(({ a, texto, Icono }) => (
          <li key={a}>
            <NavLink
              to={a}
              end={a === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-lima' : 'text-crema-tenue hover:text-crema'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-full px-4 py-1 transition-colors ${isActive ? 'bg-bosque-2' : ''}`}>
                    <Icono aria-hidden="true" className="size-5" />
                  </span>
                  {texto}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
