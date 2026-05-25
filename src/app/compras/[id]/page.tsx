import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PedidoDetalhe } from "./PedidoDetalhe";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedidoId = parseInt(id);
  if (isNaN(pedidoId)) notFound();

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos_compra")
    .select("id, status, total, data_prevista, observacoes, criado_em, fornecedores ( nome )")
    .eq("id", pedidoId)
    .single();

  if (!pedido) notFound();

  const { data: itens } = await supabase
    .from("pedido_compra_itens")
    .select("id, produto_nome, variacao_descricao, quantidade, preco_custo, subtotal")
    .eq("pedido_id", pedidoId)
    .order("id");

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/compras" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Pedidos
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">🛍️ Pedido de compra</h1>
      </div>
      <PedidoDetalhe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pedido={pedido as any}
        itens={itens ?? []}
      />
    </div>
  );
}
