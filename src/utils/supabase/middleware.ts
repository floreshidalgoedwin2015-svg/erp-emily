// Middleware do Supabase - mantém a sessão do usuário "viva" enquanto navega pelo sistema
// Roda a cada requisição que o navegador faz

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: Não escreva nenhum código entre createServerClient e
  // supabase.auth.getUser(). Um simples erro pode fazer com que seja muito
  // difícil debugar problemas de logout aleatório.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Aqui podemos redirecionar usuários não logados para a tela de login
  // Vamos adicionar essa lógica depois, na Tarefa #3 (login dos atendentes)
  // Por exemplo:
  // if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

  return supabaseResponse;
}
