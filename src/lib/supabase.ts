import { createClient } from '@supabase/supabase-js'

// Solo se usan la URL y la clave anónima/publicable: son públicas por diseño,
// lo que protege los datos es la RLS de la base. La clave service_role NUNCA va aquí.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !claveAnonima) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example como .env.local y complétalo.')
}

export const supabase = createClient(url, claveAnonima, {
  auth: {
    // La sesión (anónima o de organizador) se guarda en este navegador.
    persistSession: true,
    autoRefreshToken: true,
  },
})
