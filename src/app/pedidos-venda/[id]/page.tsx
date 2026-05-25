import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PedidoVendaDetalhe } from "./PedidoVendaDetalhe";

export default async function PedidoVendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedidoId = parseInt(id);
  if (isNaN(pedidoId)) notFound();

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos_venda")
    .select("id, status, total, cliente_nome, forma_pagamento, endereco_entrega, observacoes, criado_em")
    .eq("id", pedidoId)
    .single();

  if (!pedido) notFound();

  const { data: itens } = await supabase
    .from("pedido_venda_itens")
    .select("id, produto_nome, variacao_descricao, quantidade, preco_unitario, subtotal")
    .eq("pedido_id", pedidoId)
    .order("id");

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/pedidos-venda" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Pedidos de Venda
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">🛍️ Pedido de venda</h1>
      </div>
      <PedidoVendaDetalhe
        pedido={pedido}
        itens={itens ?? []}
      />
    </div>
  );
}
