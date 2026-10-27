import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProveedorSesion } from './hooks/useSesion'
import Actividad from './pages/Actividad'
import Bolsa from './pages/Bolsa'
import Calendario from './pages/Calendario'
import Encuesta from './pages/Encuesta'
import Inicio from './pages/Inicio'
import Privacidad from './pages/Privacidad'
import Ranking from './pages/Ranking'
import Registro from './pages/Registro'

function NoEncontrada() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-[15px] text-muted">
        Revisa el enlace o vuelve al <Link to="/" className="font-medium text-accent underline">inicio</Link>.
      </p>
    </section>
  )
}

// Rutas públicas (Fase 2). Las rutas /org del organizador se agregan en la Fase 3.
export default function App() {
  return (
    <ProveedorSesion>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/actividad/:id" element={<Actividad />} />
          <Route path="/actividad/:id/bolsa" element={<Bolsa />} />
          <Route path="/encuesta" element={<Encuesta />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </ProveedorSesion>
  )
}
