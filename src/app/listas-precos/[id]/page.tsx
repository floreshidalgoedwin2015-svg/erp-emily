import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { adicionarItem, removerItem } from "./actions";

export default async function GerenciarListaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listaId = parseInt(id);
  if (isNaN(listaId)) notFound();

  const supabase = await createClient();

  // Busca a lista
  const { data: lista } = await supabase
    .from("listas_precos")
    .select("id, nome")
    .eq("id", listaId)
    .single();

  if (!lista) notFound();

  // Busca os itens da lista com o nome do produto
  const { data: itens } = await supabase
    .from("lista_preco_itens")
    .select("id, preco, produto_id, produtos ( id, nome, codigo )")
    .eq("lista_id", listaId)
    .order("criado_em", { ascending: true });

  // Busca todos os produtos para o select de adicionar
  const { data: todosProdutos } = await supabase
    .from("produtos")
    .select("id, nome, codigo")
    .eq("ativo", true)
    .order("nome");

  // IDs dos produtos já na lista (para filtrar o select)
  const idsProdutosNaLista = new Set(itens?.map((i) => i.produto_id) ?? []);

  // Produtos disponíveis para adicionar
  const produtosDisponiveis = (todosProdutos ?? []).filter(
    (p) => !idsProdutosNaLista.has(p.id)
  );

  // Bind das actions com o listaId
  const adicionarItemBound = adicionarItem.bind(null, listaId);
  const removerItemBound = removerItem.bind(null, listaId);

  const inputCls =
    "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 " +
    "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white";

  return (
    <div className="p-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <a
          href="/listas-precos"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para Listas de preço
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">💲 {lista.nome}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {itens?.length ?? 0} produto{(itens?.length ?? 0) !== 1 ? "s" : ""} nesta lista
        </p>
      </div>

      {/* ── Adicionar produto ── */}
      {produtosDisponiveis.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-zinc-800 mb-4">➕ Adicionar produto à lista</h2>
          <form action={adicionarItemBound} className="flex flex-col sm:flex-row gap-3">
            <select
              name="produto_id"
              required
              className={inputCls + " flex-1"}
            >
              <option value="">Selecione um produto...</option>
              {produtosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}{p.codigo ? ` (${p.codigo})` : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-3 shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="preco"
                  required
                  placeholder="0,00"
                  className={inputCls + " pl-9 w-36"}
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Produtos na lista ── */}
      {(!itens || itens.length === 0) ? (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">
            Nenhum produto nesta lista ainda
          </h3>
          <p className="text-zinc-500 text-sm">
            Adicione produtos acima e defina o preço especial de cada um.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <h2 className="font-semibold text-zinc-800">🏷️ Produtos na lista</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Produto
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Preço especial
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {itens.map((item) => {
                const produto = item.produtos as unknown as {
                  id: number;
                  nome: string;
                  codigo: string | null;
                } | null;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-800">
                        {produto?.nome ?? "—"}
                      </div>
                      {produto?.codigo && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          SKU: {produto.codigo}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-amber-800">
                        R$ {item.preco.toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={removerItemBound} className="inline">
                        <input type="hidden" name="item_id" value={item.id} />
                        <button
                          type="submit"
                          className="text-zinc-300 hover:text-red-500 text-xs font-medium transition hover:underline"
                        >
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Aviso quando todos os produtos já estão na lista */}
      {produtosDisponiveis.length === 0 && (itens?.length ?? 0) > 0 && (
        <p className="text-xs text-zinc-400 mt-4 text-center">
          ✅ Todos os produtos cadastrados já estão nesta lista.
        </p>
      )}
    </div>
  );
}
