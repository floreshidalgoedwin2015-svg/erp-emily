"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function criarLista(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = String(formData.get("nome") || "").trim();
  if (!nome) return;

  const { data: lista, error } = await supabase
    .from("listas_precos")
    .insert({ nome })
    .select("id")
    .single();

  if (!error && lista) {
    redirect(`/listas-precos/${lista.id}`);
  }

  revalidatePath("/listas-precos");
}

export async function excluirLista(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const listaId = Number(formData.get("lista_id"));
  if (!listaId) return;

  await supabase.from("listas_precos").delete().eq("id", listaId);

  revalidatePath("/listas-precos");
  redirect("/listas-precos");
}
