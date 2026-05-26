"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoEnvio = { sucesso: boolean; erro?: string };

export async function salvarEnvio(
  pedidoId: number,
  codigoRastreamento: string,
  servicoEnvio: string,
): Promise<ResultadoEnvio> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("pedidos_venda")
    .update({
      codigo_rastreamento: codigoRastreamento.trim().toUpperCase() || null,
      servico_envio: servicoEnvio || null,
      status: "enviado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/envios");
  revalidatePath(`/pedidos-venda/${pedidoId}`);
  return { sucesso: true };
}

export async function atualizarRastreamento(
  pedidoId: number,
  codigoRastreamento: string,
): Promise<ResultadoEnvio> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("pedidos_venda")
    .update({ codigo_rastreamento: codigoRastreamento.trim().toUpperCase() || null, atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/envios");
  return { sucesso: true };
}
