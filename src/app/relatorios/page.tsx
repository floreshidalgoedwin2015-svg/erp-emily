import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// ── Tipos locais ──────────────────────────────────────────────
type Venda = {
  id: number;
  numero_venda: number;
  total: number;
  subtotal: number;
  desconto: number;
  forma_pagamento: string;
  cliente_nome: string | null;
  criado_em: string;
};

type VendaItem = {
  venda_id: number;
  quantidade: number;
  subtotal: number;
  variacoes: unknown;
};

// ── Helpers ───────────────────────────────────────────────────
function getDateRange(periodo: string): { inicio: string; fim: string } {
  const hoje = new Date();
  const fim = hoje.toISOString().split("T")[0];
  if (periodo === "hoje") return { inicio: fim, fim };
  if (periodo === "7d") {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6);
    return { inicio: d.toISOString().split("T")[0], fim };
  }
  if (periodo === "mes") {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: d.toISOString().split("T")[0], fim };
  }
  // 30d (padrão)
  const d = new Date(hoje);
  d.setDate(hoje.getDate() - 29);
  return { inicio: d.toISOString().split("T")[0], fim };
}

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mes", label: "Este mês" },
];

const FORMAS_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  misto: "Misto",
};

// ── Página ────────────────────────────────────────────────────
export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { periodo: periodoParam } = await searchParams;
  const periodo = periodoParam ?? "30d";
  const { inicio, fim } = getDateRange(periodo);

  // ── Busca vendas no período ──
  const { data: vendas } = await supabase
    .from("vendas")
    .select(
      "id, numero_venda, total, subtotal, desconto, forma_pagamento, cliente_nome, criado_em"
    )
    .gte("criado_em", `${inicio}T00:00:00`)
    .lte("criado_em", `${fim}T23:59:59`)
    .eq("status", "concluida")
    .order("criado_em", { ascending: false });

  // ── Busca itens das vendas ──
  const vendaIds = (vendas ?? []).map((v) => v.id);
  const { data: itens } = vendaIds.length > 0
    ? await supabase
        .from("venda_itens")
        .select(
          "venda_id, quantidade, subtotal, variacoes ( produto_id, tamanho, cor, produtos ( nome, codigo ) )"
        )
        .in("venda_id", vendaIds)
    : { data: [] };

  // ── Cálculos de resumo ──
  const totalVendas = (vendas ?? []).length;
  const faturamento = (vendas ?? []).reduce((s, v) => s + v.total, 0);
  const descontoTotal = (vendas ?? []).reduce((s, v) => s + (v.desconto ?? 0), 0);
  const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

  // ── Formas de pagamento ──
  const pagamentos: Record<string, number> = {};
  for (const v of vendas ?? []) {
    pagamentos[v.forma_pagamento] =
      (pagamentos[v.forma_pagamento] ?? 0) + v.total;
  }
  const pagamentosOrdenados = Object.entries(pagamentos).sort(
    (a, b) => b[1] - a[1]
  );

  // ── Top produtos ──
  const produtoMap = new Map<
    string,
    { nome: string; codigo: string | null; quantidade: number; total: number }
  >();
  for (const item of itens ?? []) {
    const v = item.variacoes as unknown as {
      produto_id: number;
      tamanho: string | null;
      cor: string | null;
      produtos: { nome: string; codigo: string | null } | null;
    } | null;
    const nome = v?.produtos?.nome ?? "Produto desconhecido";
    const codigo = v?.produtos?.codigo ?? null;
    const existing = produtoMap.get(nome) ?? {
      nome,
      codigo,
      quantidade: 0,
      total: 0,
    };
    existing.quantidade += item.quantidade;
    existing.total += item.subtotal;
    produtoMap.set(nome, existing);
  }
  const topProdutos = Array.from(produtoMap.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  const maxQtdProduto = topProdutos[0]?.quantidade ?? 1;

  return (
    <div className="p-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Início
        </a>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">
              📊 Relatórios
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {inicio === fim
                ? new Date(inicio + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })
                : `${new Date(inicio + "T12:00:00").toLocaleDateString("pt-BR")} até ${new Date(fim + "T12:00:00").toLocaleDateString("pt-BR")}`}
            </p>
          </div>

          {/* Filtro de período */}
          <div className="flex gap-1.5 flex-wrap">
            {PERIODOS.map((p) => (
              <a
                key={p.value}
                href={`/relatorios?periodo=${p.value}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  periodo === p.value
                    ? "bg-amber-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="text-3xl mb-1">🛒</div>
          <div className="text-2xl font-bold text-zinc-800">{totalVendas}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Vendas realizadas</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="text-3xl mb-1">💰</div>
          <div className="text-2xl font-bold text-amber-700">
            {fmt(faturamento)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Faturamento total</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-zinc-800">
            {fmt(ticketMedio)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Ticket médio</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="text-3xl mb-1">🏷️</div>
          <div className="text-2xl font-bold text-zinc-800">
            {fmt(descontoTotal)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Descontos dados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ── Formas de pagamento ── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-800 mb-4">
            💳 Formas de pagamento
          </h2>
          {pagamentosOrdenados.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-6">
              Nenhuma venda no período
            </p>
          ) : (
            <div className="space-y-3">
              {pagamentosOrdenados.map(([forma, valor]) => {
                const pct = faturamento > 0 ? (valor / faturamento) * 100 : 0;
                return (
                  <div key={forma}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-zinc-700">
                        {FORMAS_LABEL[forma] ?? forma}
                      </span>
                      <span className="text-zinc-500">
                        {fmt(valor)}{" "}
                        <span className="text-zinc-400 text-xs">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top produtos ── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-800 mb-4">
            👗 Produtos mais vendidos
          </h2>
          {topProdutos.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-6">
              Nenhuma venda no período
            </p>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((p, idx) => {
                const pct = (p.quantidade / maxQtdProduto) * 100;
                return (
                  <div key={p.nome}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-zinc-400 w-4 shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-zinc-700 truncate">
                          {p.nome}
                        </span>
                      </div>
                      <span className="text-zinc-500 shrink-0 ml-2">
                        {p.quantidade} un.
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Lista de vendas ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">🧾 Vendas do período</h2>
          <span className="text-xs text-zinc-500">
            {totalVendas} venda{totalVendas !== 1 ? "s" : ""}
          </span>
        </div>

        {(vendas ?? []).length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-sm">
            Nenhuma venda no período selecionado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Venda
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Cliente
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Pagamento
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Data
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {(vendas as Venda[]).map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-amber-50/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-amber-700">
                      #{v.numero_venda}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-zinc-600">
                      {v.cliente_nome || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center hidden md:table-cell">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      {FORMAS_LABEL[v.forma_pagamento] ?? v.forma_pagamento}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="text-zinc-600 text-xs">
                      {new Date(v.criado_em).toLocaleDateString("pt-BR")}
                      {" "}
                      {new Date(v.criado_em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-zinc-800">
                      {fmt(v.total)}
                    </span>
                    {v.desconto > 0 && (
                      <div className="text-xs text-zinc-400">
                        −{fmt(v.desconto)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {totalVendas > 1 && (
              <tfoot>
                <tr className="border-t-2 border-amber-200 bg-amber-50">
                  <td
                    colSpan={4}
                    className="px-5 py-3 text-sm font-semibold text-zinc-700"
                  >
                    Total do período
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-amber-700 text-base">
                    {fmt(faturamento)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
