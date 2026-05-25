import { createClient } from "@/utils/supabase/server";
import { PedidoForm } from "./PedidoForm";

export default async function NovoPedidoPage() {
  const supabase = await createClient();

  const [{ data: fornecedores }, { data: produtos }] = await Promise.all([
    supabase.from("fornecedores").select("id, nome").order("nome"),
    supabase
      .from("produtos")
      .select("id, nome, variacoes ( id, tamanho, cor, preco_custo )")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/compras" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Pedidos
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">➕ Novo pedido de compra</h1>
        <p className="text-zinc-500 text-sm mt-1">Registre o que será pedido ao fornecedor.</p>
      </div>

      <PedidoForm
        fornecedores={fornecedores ?? []}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        produtos={(produtos ?? []) as any}
      />
    </div>
  );
}
