"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function adicionarItem(
  listaId: number,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const produtoId = Number(formData.get("produto_id"));
  const precoStr = String(formData.get("preco") || "").replace(",", ".");
  const preco = parseFloat(precoStr);

  if (!produtoId || isNaN(preco) || preco <= 0) return;

  await supabase.from("lista_preco_itens").upsert(
    { lista_id: listaId, produto_id: produtoId, preco },
    { onConflict: "lista_id,produto_id" }
  );

  revalidatePath(`/listas-precos/${listaId}`);
}

export async function removerItem(
  listaId: number,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const itemId = Number(formData.get("item_id"));
  if (!itemId) return;

  await supabase.from("lista_preco_itens").delete().eq("id", itemId);

  revalidatePath(`/listas-precos/${listaId}`);
}

export async function atualizarPrecoItem(
  listaId: number,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const itemId = Number(formData.get("item_id"));
  const precoStr = String(formData.get("preco") || "").replace(",", ".");
  const preco = parseFloat(precoStr);

  if (!itemId || isNaN(preco) || preco <= 0) return;

  await supabase
    .from("lista_preco_itens")
    .update({ preco })
    .eq("id", itemId);

  revalidatePath(`/listas-precos/${listaId}`);
}
