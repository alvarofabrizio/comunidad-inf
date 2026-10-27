import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OrgLayout } from './components/OrgLayout'
import { RutaOrganizador } from './components/RutaOrganizador'
import EditorActividad from './pages/org/EditorActividad'
import EditorEncuesta from './pages/org/EditorEncuesta'
import GestionActividad from './pages/org/GestionActividad'
import Login from './pages/org/Login'
import Panel from './pages/org/Panel'
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

// Rutas públicas y del panel del organizador (/org).
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

        {/* Panel del organizador. RutaOrganizador protege en el frontend; la RLS, en la base. */}
        <Route path="/org" element={<OrgLayout />}>
          <Route path="login" element={<Login />} />
          <Route element={<RutaOrganizador />}>
            <Route index element={<Panel />} />
            <Route path="actividad/nueva" element={<EditorActividad />} />
            <Route path="actividad/:id" element={<GestionActividad />} />
            <Route path="actividad/:id/editar" element={<EditorActividad />} />
            <Route path="encuesta/nueva" element={<EditorEncuesta />} />
            <Route path="encuesta/:id" element={<EditorEncuesta />} />
          </Route>
        </Route>
      </Routes>
    </ProveedorSesion>
  )
}
