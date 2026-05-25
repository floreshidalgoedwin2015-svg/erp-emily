// Cliente Supabase para uso no NAVEGADOR (Client Components)
// Use este quando precisar acessar o banco de dentro de componentes que rodam no navegador

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
