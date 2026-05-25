import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // Se já está logada, vai direto pro dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-zinc-900 text-3xl mb-4 shadow-lg">
            👗
          </div>
          <h1 className="text-3xl font-bold text-amber-400">Emily Plus Size</h1>
          <p className="text-zinc-500 text-sm mt-1">Sistema de Gestão (ERP)</p>
        </div>

        {/* Card de login */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-1">
            Entrar no sistema
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Use o email e senha cadastrados pela gerência.
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Emily Plus Size ERP · v0.1
        </p>
      </div>
    </div>
  );
}
