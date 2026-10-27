import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

const raiz = createRoot(document.getElementById('root')!)

// Si faltan las variables de entorno (por ejemplo, mal configuradas en Vercel),
// se muestra un aviso en vez de una página en blanco. La app se importa recién
// después de comprobarlo, porque src/lib/supabase.ts falla al cargarse sin ellas.
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  raiz.render(
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">Comunidad INF no está configurada</h1>
      <p className="mt-2 text-[15px] text-muted">
        Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Agrégalas con esos nombres exactos en la
        configuración del despliegue y vuelve a desplegar.
      </p>
    </main>,
  )
} else {
  void import('./App').then(({ default: App }) =>
    raiz.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    ),
  )
}
