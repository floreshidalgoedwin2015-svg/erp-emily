"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

type Resultado = { sucesso: boolean; erro?: string };

export async function mudarSituacaoProdutos(
  ids: number[],
  ativo: boolean,
): Promise<Resultado> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!ids.length) return { sucesso: false, erro: "Nenhum produto selecionado." };

  const { error } = await supabase.from("produtos").update({ ativo }).in("id", ids);
  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/produtos");
  return { sucesso: true };
}

export async function reajustarPrecosProdutos(
  ids: number[],
  percentual: number,
  tipo: "acrescimo" | "desconto",
): Promise<Resultado> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!ids.length) return { sucesso: false, erro: "Nenhum produto selecionado." };
  if (percentual <= 0 || percentual > 100) return { sucesso: false, erro: "Percentual inválido." };

  const { data: variacoes } = await supabase
    .from("variacoes")
    .select("id, preco_venda")
    .in("produto_id", ids)
    .gt("preco_venda", 0);

  const fator = tipo === "acrescimo" ? 1 + percentual / 100 : 1 - percentual / 100;

  for (const v of variacoes ?? []) {
    const novoPreco = Math.round(v.preco_venda * fator * 100) / 100;
    await supabase.from("variacoes").update({ preco_venda: novoPreco }).eq("id", v.id);
  }

  revalidatePath("/produtos");
  return { sucesso: true };
}

export async function vincularProdutosALista(
  ids: number[],
  listaId: number,
): Promise<Resultado> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!ids.length) return { sucesso: false, erro: "Nenhum produto selecionado." };

  // Pega o menor preço de cada produto
  const { data: variacoes } = await supabase
    .from("variacoes")
    .select("produto_id, preco_venda")
    .in("produto_id", ids)
    .gt("preco_venda", 0);

  const precos: Record<number, number> = {};
  for (const v of variacoes ?? []) {
    if (!precos[v.produto_id] || v.preco_venda < precos[v.produto_id]) {
      precos[v.produto_id] = v.preco_venda;
    }
  }

  const itens = ids
    .filter(id => precos[id] > 0)
    .map(id => ({ lista_id: listaId, produto_id: id, preco: precos[id] }));

  if (itens.length > 0) {
    await supabase.from("lista_preco_itens").upsert(itens, { onConflict: "lista_id,produto_id" });
  }

  revalidatePath(`/listas-precos/${listaId}`);
  return { sucesso: true };
}
