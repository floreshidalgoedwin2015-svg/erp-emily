import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { EditarProdutoForm } from "./EditarProdutoForm";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produtoId = parseInt(id);
  if (isNaN(produtoId)) notFound();

  const supabase = await createClient();

  const [{ data: produto }, { data: categorias }, { data: fornecedores }] =
    await Promise.all([
      supabase
        .from("produtos")
        .select(
          `id, nome, codigo, categoria_id, fornecedor_id,
           categorias ( id, nome ),
           fornecedores ( id, nome ),
           variacoes ( id, tamanho, cor, preco_venda, preco_custo, estoque_atual, estoque_minimo )`
        )
        .eq("id", produtoId)
        .single(),
      supabase.from("categorias").select("id, nome").order("nome"),
      supabase.from("fornecedores").select("id, nome").order("nome"),
    ]);

  if (!produto) notFound();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <a
          href="/produtos"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para Produtos
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">✏️ Editar produto</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Atualize as informações, preços e estoque das variações.
        </p>
      </div>

      <EditarProdutoForm
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        produto={produto as any}
        categorias={categorias ?? []}
        fornecedores={fornecedores ?? []}
      />
    </div>
  );
}
