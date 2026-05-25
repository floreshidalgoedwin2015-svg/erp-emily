"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type VariacaoEditar = {
  id?: number;
  tamanho: string | null;
  cor: string | null;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_anterior: number;
};

export type ResultadoEdicao = {
  sucesso: boolean;
  erro?: string;
};

export async function atualizarProduto(
  produtoId: number,
  dados: {
    nome: string;
    categoria_id: number | null;
    fornecedor_id: number | null;
  },
  variacoes: VariacaoEditar[],
): Promise<ResultadoEdicao> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  // 1. Atualiza o produto
  const { error: erroProduto } = await supabase
    .from("produtos")
    .update({
      nome: dados.nome.trim(),
      categoria_id: dados.categoria_id,
      fornecedor_id: dados.fornecedor_id || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", produtoId);

  if (erroProduto) return { sucesso: false, erro: erroProduto.message };

  // 2. Processa variações
  for (const v of variacoes) {
    if (v.id) {
      const { error } = await supabase
        .from("variacoes")
        .update({
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          preco_venda: v.preco_venda,
          preco_custo: v.preco_custo,
          estoque_atual: v.estoque_atual,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", v.id);

      if (error) continue;

      // Registra movimentação se estoque mudou
      if (v.estoque_anterior !== v.estoque_atual) {
        const diff = v.estoque_atual - v.estoque_anterior;
        await supabase.from("movimentacoes_estoque").insert({
          variacao_id: v.id,
          tipo: "ajuste",
          quantidade: Math.abs(diff),
          estoque_antes: v.estoque_anterior,
          estoque_depois: v.estoque_atual,
          motivo: "Ajuste manual",
          usuario_id: user.id,
        });
      }
    } else {
      const { data: novaVar } = await supabase
        .from("variacoes")
        .insert({
          produto_id: produtoId,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          preco_venda: v.preco_venda,
          preco_custo: v.preco_custo,
          estoque_atual: v.estoque_atual,
        })
        .select()
        .single();

      if (novaVar && v.estoque_atual > 0) {
        await supabase.from("movimentacoes_estoque").insert({
          variacao_id: novaVar.id,
          tipo: "entrada",
          quantidade: v.estoque_atual,
          estoque_antes: 0,
          estoque_depois: v.estoque_atual,
          motivo: "Cadastro manual",
          usuario_id: user.id,
        });
      }
    }
  }

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${produtoId}`);

  return { sucesso: true };
}
