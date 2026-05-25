"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ItemVenda = {
  variacao_id: number;
  produto_nome: string;
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type DadosVenda = {
  itens: ItemVenda[];
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  cliente_nome: string;
  cliente_telefone: string;
};

export type ResultadoVenda = {
  sucesso: boolean;
  numero_venda?: number;
  erro?: string;
};

export async function finalizarVenda(
  dados: DadosVenda
): Promise<ResultadoVenda> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  if (dados.itens.length === 0)
    return { sucesso: false, erro: "Carrinho vazio." };

  // 1. Verificar estoque disponível para todos os itens
  const variacaoIds = dados.itens.map((i) => i.variacao_id);
  const { data: variacoes } = await supabase
    .from("variacoes")
    .select("id, estoque_atual")
    .in("id", variacaoIds);

  if (!variacoes) return { sucesso: false, erro: "Erro ao verificar estoque." };

  const mapaEstoque: Record<number, number> = Object.fromEntries(
    variacoes.map((v) => [v.id, v.estoque_atual])
  );

  for (const item of dados.itens) {
    const disponivel = mapaEstoque[item.variacao_id] ?? 0;
    if (disponivel < item.quantidade) {
      return {
        sucesso: false,
        erro: `Estoque insuficiente para "${item.produto_nome}". Disponível: ${disponivel} un.`,
      };
    }
  }

  // 2. Criar a venda
  const { data: venda, error: erroVenda } = await supabase
    .from("vendas")
    .insert({
      atendente_id: user.id,
      cliente_nome: dados.cliente_nome || null,
      cliente_telefone: dados.cliente_telefone || null,
      subtotal: dados.subtotal,
      desconto: dados.desconto,
      total: dados.total,
      forma_pagamento: dados.forma_pagamento,
      status: "concluida",
    })
    .select("id, numero_venda")
    .single();

  if (erroVenda || !venda)
    return { sucesso: false, erro: erroVenda?.message ?? "Erro ao criar venda." };

  // 3. Inserir itens da venda
  const { error: erroItens } = await supabase.from("venda_itens").insert(
    dados.itens.map((item) => ({
      venda_id: venda.id,
      variacao_id: item.variacao_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
    }))
  );

  if (erroItens) {
    // Desfaz a venda se os itens falharam
    await supabase.from("vendas").delete().eq("id", venda.id);
    return { sucesso: false, erro: erroItens.message };
  }

  // 4. Atualizar estoque e registrar movimentações
  for (const item of dados.itens) {
    const estoqueAntes = mapaEstoque[item.variacao_id];
    const estoqueDepois = estoqueAntes - item.quantidade;

    await supabase
      .from("variacoes")
      .update({
        estoque_atual: estoqueDepois,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", item.variacao_id);

    await supabase.from("movimentacoes_estoque").insert({
      variacao_id: item.variacao_id,
      tipo: "venda",
      quantidade: item.quantidade,
      estoque_antes: estoqueAntes,
      estoque_depois: estoqueDepois,
      motivo: `Venda #${venda.numero_venda}`,
      venda_id: venda.id,
      usuario_id: user.id,
    });
  }

  revalidatePath("/pdv");
  revalidatePath("/dashboard");

  return { sucesso: true, numero_venda: venda.numero_venda as number };
}
