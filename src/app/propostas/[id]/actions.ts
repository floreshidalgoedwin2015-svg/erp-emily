"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoProposta =
  | { sucesso: true; id: number }
  | { sucesso: false; erro: string };

export async function atualizarStatusProposta(
  id: number,
  status: "enviada" | "aprovada" | "recusada",
): Promise<ResultadoProposta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("propostas")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
  return { sucesso: true, id };
}
