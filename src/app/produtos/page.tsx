import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from("produtos")
    .select(`
      id, nome, codigo, foto_url, ativo, criado_em,
      categorias ( nome ),
      variacoes ( id, estoque_atual, preco_venda )
    `)
    .eq("ativo", true)
    .order("nome");

  if (q && q.trim()) {
    query = query.or(`nome.ilike.%${q.trim()}%,codigo.ilike.%${q.trim()}%`);
  }

  const { data: produtos } = await query;
  const totalProdutos = produtos?.length ?? 0;

  function fmtPreco(n: number) {
    return "R$ " + n.toFixed(2).replace(".", ",");
  }

  return (
    <div className="p-8 max-w-6xl">

      {/* Cabeçalho */}
      <div className="mb-6">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Início
        </a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">👗 Produtos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {totalProdutos} produto{totalProdutos !== 1 ? "s" : ""}
              {q ? ` encontrado${totalProdutos !== 1 ? "s" : ""} para "${q}"` : " cadastrados"}
            </p>
          </div>
          <Link
            href="/produtos/novo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0"
          >
            + Incluir cadastro
          </Link>
        </div>
      </div>

      {/* Barra de busca */}
      <form method="GET" className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Pesquisar por nome ou código..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition"
          >
            Buscar
          </button>
          {q && (
            <a
              href="/produtos"
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-500 text-sm font-medium hover:bg-zinc-50 transition"
            >
              Limpar
            </a>
          )}
        </div>
      </form>

      {/* Lista vazia */}
      {totalProdutos === 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👗</div>
          {q ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Nenhum resultado para &quot;{q}&quot;.
              </p>
              <a
                href="/produtos"
                className="text-amber-700 hover:underline text-sm"
              >
                Ver todos os produtos
              </a>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Tabela de produtos */}
      {totalProdutos > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16">
                  Imagem
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Descrição
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Código
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Preço
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Estoque
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {produtos?.map((produto) => {
                const variacoes = produto.variacoes ?? [];
                const estoqueTotal = variacoes.reduce(
                  (acc: number, v: { estoque_atual: number }) =>
                    acc + (v.estoque_atual ?? 0),
                  0
                );
                const precos = variacoes
                  .map((v: { preco_venda: number }) => v.preco_venda)
                  .filter((p: number) => p > 0);
                const precoMin = precos.length > 0 ? Math.min(...precos) : 0;
                const precoMax = precos.length > 0 ? Math.max(...precos) : 0;
                const precoStr =
                  precos.length === 0
                    ? "—"
                    : precoMin === precoMax
                    ? fmtPreco(precoMin)
                    : `${fmtPreco(precoMin)} – ${fmtPreco(precoMax)}`;

                return (
                  <tr
                    key={produto.id}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    {/* Imagem */}
                    <td className="px-4 py-3 w-16">
                      {produto.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={produto.foto_url}
                          alt={produto.nome}
                          className="w-12 h-12 object-cover rounded-lg border border-zinc-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-xl">
                          👗
                        </div>
                      )}
                    </td>

                    {/* Descrição */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800 leading-snug">
                        {produto.nome}
                        {variacoes.length > 0 && (
                          <span className="ml-2 text-xs text-zinc-400 font-normal">
                            ({variacoes.length}{" "}
                            {variacoes.length === 1 ? "variação" : "variações"})
                          </span>
                        )}
                      </div>
                      {(produto.categorias as unknown as { nome: string } | null)
                        ?.nome && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {
                            (
                              produto.categorias as unknown as {
                                nome: string;
                              } | null
                            )?.nome
                          }
                        </div>
                      )}
                    </td>

                    {/* Código */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-zinc-500 font-mono text-xs">
                        {produto.codigo || "—"}
                      </span>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-zinc-700 font-medium text-xs">
                        {precoStr}
                      </span>
                    </td>

                    {/* Estoque */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span
                        className={`font-semibold text-sm ${
                          estoqueTotal === 0
                            ? "text-red-500"
                            : estoqueTotal <= 5
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {estoqueTotal}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/produtos/${produto.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 transition"
                      >
                        ✏️ Editar
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
