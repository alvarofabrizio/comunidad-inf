import { LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DameroPixeles, Logotipo } from './Marca'

// Autoría: los integrantes del equipo son los responsables del proyecto.
export const INTEGRANTES = ['Carlos Monge', 'Alvaro Ferro', 'Mayerli López', "Sebastián O'Brien", 'Bianca Pulido']

/** Pie en bosque: cierra cada vista con el logotipo, el crédito académico y los enlaces. */
export function Pie() {
  return (
    <footer className="zona-oscura relative overflow-hidden bg-bosque">
      <DameroPixeles className="absolute top-0 right-0 w-24 opacity-60" />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 text-[13px] text-crema-tenue sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logotipo />
          <p className="mt-4 font-medium text-crema">Proyecto académico, Ética y RSU, PUCP 2026-2</p>
          <p className="mt-1">
            Hecho por {INTEGRANTES.slice(0, -1).join(', ')} y {INTEGRANTES[INTEGRANTES.length - 1]}.
          </p>
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
        {/* Acceso al panel como botón visible; igual solo entran cuentas registradas en la tabla organizadores. */}
        <Link
          to="/org"
          className="inline-flex min-h-12 flex-none items-center justify-center gap-2 self-start rounded-xl border-2 border-lima px-5 text-[15px] font-semibold text-lima transition-colors hover:bg-lima hover:text-bosque focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima sm:self-end"
        >
          <LayoutDashboard className="size-5" aria-hidden="true" />
          Panel de organizadores
        </Link>
      </div>
    </footer>
  )
}
