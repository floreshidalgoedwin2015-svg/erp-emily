"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoTransferencia = { sucesso: boolean; erro?: string };

export async function transferirEstoque(
  variacaoId: number,
  origemId: number,
  destinoId: number,
  quantidade: number,
  observacao?: string,
): Promise<ResultadoTransferencia> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  if (origemId === destinoId) return { sucesso: false, erro: "Origem e destino não podem ser iguais." };
  if (quantidade <= 0) return { sucesso: false, erro: "Quantidade deve ser maior que zero." };

  // Verifica estoque disponível na origem
  const { data: estoqueOrigem } = await supabase
    .from("estoque_deposito")
    .select("quantidade")
    .eq("variacao_id", variacaoId)
    .eq("deposito_id", origemId)
    .maybeSingle();

  const disponivel = estoqueOrigem?.quantidade ?? 0;
  if (disponivel < quantidade) {
    return { sucesso: false, erro: `Estoque insuficiente. Disponível: ${disponivel} peça${disponivel !== 1 ? "s" : ""}.` };
  }

  // Diminui na origem
  const { error: erroOrigem } = await supabase
    .from("estoque_deposito")
    .update({ quantidade: disponivel - quantidade })
    .eq("variacao_id", variacaoId)
    .eq("deposito_id", origemId);

  if (erroOrigem) return { sucesso: false, erro: erroOrigem.message };

  // Busca qtd atual no destino e faz upsert
  const { data: estoqueDestino } = await supabase
    .from("estoque_deposito")
    .select("quantidade")
    .eq("variacao_id", variacaoId)
    .eq("deposito_id", destinoId)
    .maybeSingle();

  const { error: erroDestino } = await supabase
    .from("estoque_deposito")
    .upsert({
      variacao_id: variacaoId,
      deposito_id: destinoId,
      quantidade: (estoqueDestino?.quantidade ?? 0) + quantidade,
    }, { onConflict: "variacao_id,deposito_id" });

  if (erroDestino) return { sucesso: false, erro: erroDestino.message };

  // Registra no histórico
  await supabase.from("transferencias_estoque").insert({
    variacao_id: variacaoId,
    deposito_origem_id: origemId,
    deposito_destino_id: destinoId,
    quantidade,
    observacao: observacao?.trim() || null,
    usuario_id: user.id,
  });

  revalidatePath("/estoque/transferencias");
  return { sucesso: true };
}
