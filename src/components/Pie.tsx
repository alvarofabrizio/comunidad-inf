import { Link } from 'react-router-dom'
import { DameroPixeles, Logotipo } from './Marca'

// Los nombres del equipo se completan cuando el equipo los pase.
const INTEGRANTES = ['[INTEGRANTE 1]', '[INTEGRANTE 2]', '[INTEGRANTE 3]', '[INTEGRANTE 4]', '[INTEGRANTE 5]']

/** Pie en bosque: cierra cada vista con el logotipo, el crédito académico y los enlaces. */
export function Pie() {
  return (
    <footer className="zona-oscura relative overflow-hidden bg-bosque">
      <DameroPixeles className="absolute top-0 right-0 w-24 opacity-60" />
      <div className="relative mx-auto max-w-3xl px-4 py-8 text-[13px] text-crema-tenue">
        <Logotipo />
        <p className="mt-4 font-medium text-crema">Proyecto académico, Ética y RSU, PUCP 2026-2</p>
        <p className="mt-1">Hecho por {INTEGRANTES.join(', ')}.</p>
        <p className="mt-1">
          Uso académico y comunitario, no comercial.{' '}
          <Link to="/resumenes" className="font-medium text-lima underline underline-offset-2">
            Resúmenes
          </Link>
          {' · '}
          <Link to="/privacidad" className="font-medium text-lima underline underline-offset-2">
            Privacidad y datos personales
          </Link>
        </p>
      </div>
    </footer>
  )
}
