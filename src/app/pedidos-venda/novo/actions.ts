"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ItemPedidoVenda = {
  variacao_id: number | null;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type DadosPedidoVenda = {
  cliente_nome: string;
  cliente_id?: number | null;
  forma_pagamento?: string | null;
  endereco_entrega?: string | null;
  observacoes?: string | null;
};

export type ResultadoPedidoVenda =
  | { sucesso: true; id: number }
  | { sucesso: false; erro: string };

export async function criarPedidoVenda(
  dados: DadosPedidoVenda,
  itens: ItemPedidoVenda[],
): Promise<ResultadoPedidoVenda> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!dados.cliente_nome?.trim()) return { sucesso: false, erro: "Informe o nome do cliente." };
  if (itens.length === 0) return { sucesso: false, erro: "Adicione pelo menos um item." };

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  const { data: pedido, error } = await supabase
    .from("pedidos_venda")
    .insert({
      cliente_nome: dados.cliente_nome.trim(),
      cliente_id: dados.cliente_id ?? null,
      forma_pagamento: dados.forma_pagamento ?? null,
      endereco_entrega: dados.endereco_entrega?.trim() || null,
      observacoes: dados.observacoes?.trim() || null,
      total,
      status: "novo",
      usuario_id: user.id,
    })
    .select()
    .single();

  if (error || !pedido) return { sucesso: false, erro: error?.message ?? "Erro ao criar pedido." };

  const { error: erroItens } = await supabase.from("pedido_venda_itens").insert(
    itens.map((i) => ({
      pedido_id: pedido.id,
      variacao_id: i.variacao_id,
      produto_nome: i.produto_nome,
      variacao_descricao: i.variacao_descricao,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario,
      subtotal: i.subtotal,
    })),
  );

  if (erroItens) return { sucesso: false, erro: erroItens.message };

  revalidatePath("/pedidos-venda");
  redirect(`/pedidos-venda/${pedido.id}`);
}
