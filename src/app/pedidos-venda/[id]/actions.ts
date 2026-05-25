"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoAcao = { sucesso: boolean; erro?: string };

export async function atualizarStatusPedidoVenda(
  pedidoId: number,
  novoStatus: "confirmado" | "separando" | "enviado" | "entregue" | "cancelado",
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("pedidos_venda")
    .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/pedidos-venda");
  revalidatePath(`/pedidos-venda/${pedidoId}`);
  revalidatePath("/dashboard");
  return { sucesso: true };
}
