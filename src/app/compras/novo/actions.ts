"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ItemPedido = {
  variacao_id: number | null;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_custo: number;
  subtotal: number;
};

export type ResultadoPedido =
  | { sucesso: true; id: number }
  | { sucesso: false; erro: string };

export async function criarPedidoCompra(
  fornecedor_id: number,
  data_prevista: string | null,
  observacoes: string | null,
  itens: ItemPedido[],
): Promise<ResultadoPedido> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (itens.length === 0) return { sucesso: false, erro: "Adicione pelo menos um item." };

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  const { data: pedido, error } = await supabase
    .from("pedidos_compra")
    .insert({
      fornecedor_id,
      data_prevista: data_prevista || null,
      observacoes: observacoes || null,
      total,
      status: "rascunho",
      usuario_id: user.id,
    })
    .select()
    .single();

  if (error || !pedido) return { sucesso: false, erro: error?.message ?? "Erro ao criar pedido." };

  const { error: erroItens } = await supabase.from("pedido_compra_itens").insert(
    itens.map((i) => ({
      pedido_id: pedido.id,
      variacao_id: i.variacao_id,
      produto_nome: i.produto_nome,
      variacao_descricao: i.variacao_descricao,
      quantidade: i.quantidade,
      preco_custo: i.preco_custo,
      subtotal: i.subtotal,
    })),
  );

  if (erroItens) return { sucesso: false, erro: erroItens.message };

  revalidatePath("/compras");
  redirect(`/compras/${pedido.id}`);
}
