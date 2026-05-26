import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ProdutosTabela } from "./ProdutosTabela";

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "simples", label: "Produtos simples" },
  { value: "variacoes", label: "Com variações" },
];

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const supabase = await createClient();
  const { q, tipo } = await searchParams;
  const tipoAtual = tipo ?? "todos";

  let query = supabase
    .from("produtos")
    .select(`id, nome, codigo, foto_url, ativo, criado_em,
      categorias ( nome ),
      variacoes ( id, estoque_atual, preco_venda )`)
    .eq("ativo", true)
    .order("nome");

  if (q?.trim()) {
    query = query.or(`nome.ilike.%${q.trim()}%,codigo.ilike.%${q.trim()}%`);
  }

  const { data: todosProdutos } = await query;

  // Filtro de tipo feito no servidor após busca
  let produtos = todosProdutos ?? [];
  if (tipoAtual === "simples") produtos = produtos.filter(p => (p.variacoes?.length ?? 0) <= 1);
  if (tipoAtual === "variacoes") produtos = produtos.filter(p => (p.variacoes?.length ?? 0) > 1);

  const total = produtos.length;

  // Listas de preço para o modal de vincular
  const { data: listas } = await supabase
    .from("listas_precos")
    .select("id, nome")
    .order("nome");

  // Monta URL dos filtros de tipo preservando q
  function urlTipo(t: string) {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (t !== "todos") params.set("tipo", t);
    const str = params.toString();
    return "/produtos" + (str ? "?" + str : "");
  }

  return (
    <div className="p-8 max-w-6xl">

      {/* Cabeçalho */}
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Início
        </a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">👗 Produtos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {total} produto{total !== 1 ? "s" : ""}
              {q ? ` encontrado${total !== 1 ? "s" : ""} para "${q}"` : " cadastrados"}
            </p>
          </div>
          <Link href="/produtos/novo"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Incluir cadastro
          </Link>
        </div>
      </div>

      {/* Busca + Filtros de tipo */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form method="GET" className="flex gap-2 flex-1">
          {/* Preserva o tipo no submit da busca */}
          {tipoAtual !== "todos" && <input type="hidden" name="tipo" value={tipoAtual} />}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">🔍</span>
            <input type="text" name="q" defaultValue={q ?? ""}
              placeholder="Pesquisar por nome ou código..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition">
            Buscar
          </button>
          {q && (
            <a href={urlTipo(tipoAtual)} className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-500 text-sm font-medium hover:bg-zinc-50 transition">
              Limpar
            </a>
          )}
        </form>

        {/* Tabs de tipo */}
        <div className="flex gap-1.5">
          {TIPOS.map(t => (
            <a key={t.value} href={urlTipo(t.value)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${tipoAtual === t.value
                ? "bg-amber-600 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {/* Lista vazia */}
      {total === 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👗</div>
          {q ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum produto encontrado</h3>
              <p className="text-zinc-500 text-sm mb-4">Nenhum resultado para &quot;{q}&quot;.</p>
              <a href="/produtos" className="text-amber-700 hover:underline text-sm">Ver todos os produtos</a>
            </>
          ) : tipoAtual !== "todos" ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum produto nesta categoria</h3>
              <a href="/produtos" className="text-amber-700 hover:underline text-sm">Ver todos os produtos</a>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum produto ainda</h3>
              <p className="text-zinc-500 text-sm mb-6">Comece cadastrando o primeiro produto!</p>
              <Link href="/produtos/novo"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition">
                + Cadastrar primeiro produto
              </Link>
            </>
          )}
        </div>
      )}

      {/* Tabela com checkboxes e Mais ações */}
      {total > 0 && (
        <ProdutosTabela
          produtos={produtos as any}
          listas={listas ?? []}
        />
      )}
    </div>
  );
}
