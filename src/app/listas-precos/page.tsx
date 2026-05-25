import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { criarLista, excluirLista } from "./actions";

export default async function ListasPrecoPage() {
  const supabase = await createClient();

  const { data: listas } = await supabase
    .from("listas_precos")
    .select("id, nome, criado_em")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  // Conta itens por lista
  const { data: contagens } = await supabase
    .from("lista_preco_itens")
    .select("lista_id");

  const contagemPorLista = (contagens ?? []).reduce<Record<number, number>>(
    (acc, item) => {
      acc[item.lista_id] = (acc[item.lista_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const totalListas = listas?.length ?? 0;

  return (
    <div className="p-8 max-w-4xl">
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
            <h1 className="text-2xl font-bold text-zinc-800">💲 Listas de preço</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Crie listas especiais de preço: atacado, distribuidores, promoções e mais.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário — criar nova lista */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-zinc-800 mb-4">➕ Nova lista de preço</h2>
        <form action={criarLista} className="flex gap-3">
          <input
            type="text"
            name="nome"
            required
            placeholder="Ex: ATACADO +3pçs, DISTRIBUIDOR, Black Friday da EMILY..."
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0"
          >
            Criar lista
          </button>
        </form>
      </div>

      {/* Lista vazia */}
      {totalListas === 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">💲</div>
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">
            Nenhuma lista criada ainda
          </h3>
          <p className="text-zinc-500 text-sm">
            Crie sua primeira lista acima, por exemplo:{" "}
            <strong>ATACADO</strong>, <strong>DISTRIBUIDOR</strong> ou{" "}
            <strong>Black Friday</strong>.
          </p>
        </div>
      )}

      {/* Tabela de listas */}
      {totalListas > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Nome da lista
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Produtos
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {listas?.map((lista) => {
                const qtd = contagemPorLista[lista.id] ?? 0;
                return (
                  <tr key={lista.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-800">{lista.nome}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Criada em{" "}
                        {new Date(lista.criado_em).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell">
                      <span
                        className={`font-medium ${
                          qtd === 0 ? "text-zinc-400" : "text-zinc-700"
                        }`}
                      >
                        {qtd} produto{qtd !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/listas-precos/${lista.id}`}
                          className="text-amber-700 hover:text-amber-900 text-xs font-medium hover:underline"
                        >
                          Gerenciar
                        </Link>
                        <form action={excluirLista}>
                          <input
                            type="hidden"
                            name="lista_id"
                            value={lista.id}
                          />
                          <button
                            type="submit"
                            className="text-zinc-300 hover:text-red-500 text-xs font-medium transition"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
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
