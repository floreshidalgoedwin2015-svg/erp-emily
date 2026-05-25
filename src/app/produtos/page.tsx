import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function ProdutosPage() {
  const supabase = await createClient();

  // Busca produtos com categoria e contagem de variações
  const { data: produtos } = await supabase
    .from("produtos")
    .select(`
      id,
      nome,
      codigo,
      ativo,
      criado_em,
      categorias ( nome ),
      variacoes ( id, estoque_atual, preco_venda )
    `)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  const totalProdutos = produtos?.length ?? 0;

  return (
    <div className="p-8 max-w-6xl">

      {/* Cabeçalho */}
      <div className="mb-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Início
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">👗 Produtos</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {totalProdutos === 0
                ? "Nenhum produto cadastrado ainda."
                : `${totalProdutos} produto${totalProdutos !== 1 ? "s" : ""} cadastrado${totalProdutos !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <Link
            href="/produtos/novo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0"
          >
            + Novo produto
          </Link>
        </div>
      </div>

      {/* Lista vazia */}
      {totalProdutos === 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👗</div>
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">
            Nenhum produto ainda
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            Comece cadastrando o primeiro produto da sua loja!
          </p>
          <Link
            href="/produtos/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
          >
            + Cadastrar primeiro produto
          </Link>
        </div>
      )}

      {/* Tabela de produtos */}
      {totalProdutos > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Produto
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Variações
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Em estoque
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {produtos?.map((produto) => {
                const variacoes = produto.variacoes ?? [];
                const estoqueTotal = variacoes.reduce(
                  (acc: number, v: { estoque_atual: number }) => acc + (v.estoque_atual ?? 0),
                  0,
                );
                const precoMin = variacoes.length > 0
                  ? Math.min(...variacoes.map((v: { preco_venda: number }) => v.preco_venda))
                  : 0;
                const precoMax = variacoes.length > 0
                  ? Math.max(...variacoes.map((v: { preco_venda: number }) => v.preco_venda))
                  : 0;

                return (
                  <tr key={produto.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-800">{produto.nome}</div>
                      {produto.codigo && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          SKU: {produto.codigo}
                        </div>
                      )}
                      {variacoes.length > 0 && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {precoMin === precoMax
                            ? `R$ ${precoMin.toFixed(2).replace(".", ",")}`
                            : `R$ ${precoMin.toFixed(2).replace(".", ",")} – R$ ${precoMax.toFixed(2).replace(".", ",")}`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {(produto.categorias as unknown as { nome: string } | null)?.nome ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className="text-zinc-600">{variacoes.length}</span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span
                        className={`font-medium ${estoqueTotal === 0 ? "text-red-500" : estoqueTotal <= 3 ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {estoqueTotal} un.
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/produtos/${produto.id}`}
                        className="text-amber-700 hover:text-amber-900 text-xs font-medium hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
