"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoAcao = { sucesso: boolean; erro?: string };

export async function atualizarStatusPedido(
  pedidoId: number,
  novoStatus: "enviado" | "recebido" | "cancelado",
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  // Se recebendo, atualiza estoque
  if (novoStatus === "recebido") {
    const { data: itens } = await supabase
      .from("pedido_compra_itens")
      .select("variacao_id, produto_nome, quantidade, preco_custo")
      .eq("pedido_id", pedidoId);

    for (const item of itens ?? []) {
      if (!item.variacao_id) continue;

      const { data: variacao } = await supabase
        .from("variacoes")
        .select("estoque_atual")
        .eq("id", item.variacao_id)
        .single();

      if (!variacao) continue;

      const estoqueAntes = variacao.estoque_atual;
      const estoqueDepois = estoqueAntes + item.quantidade;

      await supabase
        .from("variacoes")
        .update({ estoque_atual: estoqueDepois, atualizado_em: new Date().toISOString() })
        .eq("id", item.variacao_id);

      await supabase.from("movimentacoes_estoque").insert({
        variacao_id: item.variacao_id,
        tipo: "entrada",
        quantidade: item.quantidade,
        estoque_antes: estoqueAntes,
        estoque_depois: estoqueDepois,
        motivo: `Pedido de compra #${pedidoId}`,
        usuario_id: user.id,
      });
    }

    // Atualiza preço de custo nas variações
    for (const item of itens ?? []) {
      if (!item.variacao_id || item.preco_custo <= 0) continue;
      await supabase
        .from("variacoes")
        .update({ preco_custo: item.preco_custo })
        .eq("id", item.variacao_id);
    }
  }

  const { error } = await supabase
    .from("pedidos_compra")
    .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/compras");
  revalidatePath(`/compras/${pedidoId}`);
  revalidatePath("/estoque");
  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  return { sucesso: true };
}
