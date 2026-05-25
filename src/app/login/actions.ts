"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Faz o login do atendente com email e senha
export async function login(
  state: { error?: string } | undefined,
  formData: FormData,
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha o email e a senha para entrar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou senha incorretos. Tente novamente." };
  }

  redirect("/dashboard");
}

// Faz o logout do atendente
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
