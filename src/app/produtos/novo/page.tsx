import { createClient } from "@/utils/supabase/server";
import { ProdutoForm } from "./ProdutoForm";

export default async function NovoProdutoPage() {
  const supabase = await createClient();

  // Busca categorias e fornecedores para os selects
  const [{ data: categorias }, { data: fornecedores }] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase.from("fornecedores").select("id, nome").order("nome"),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <a
          href="/produtos"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para Produtos
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">
          Cadastrar novo produto
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Preencha os dados e adicione as variações (tamanhos/cores) disponíveis.
        </p>
      </div>

      <ProdutoForm
        categorias={categorias ?? []}
        fornecedores={fornecedores ?? []}
      />
    </div>
  );
}
