import { createClient } from "@/utils/supabase/server";

const STATUS_BADGE: Record<string, string> = {
  novo: "bg-zinc-100 text-zinc-600",
  confirmado: "bg-blue-100 text-blue-700",
  separando: "bg-amber-100 text-amber-700",
  enviado: "bg-purple-100 text-purple-700",
  entregue: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  separando: "Separando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  a_prazo: "A prazo",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "confirmado", label: "Confirmados" },
  { value: "separando", label: "Separando" },
  { value: "enviado", label: "Enviados" },
  { value: "entregue", label: "Entregues" },
  { value: "cancelado", label: "Cancelados" },
];

export default async function PedidosVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;

  let query = supabase
    .from("pedidos_venda")
    .select("id, status, total, cliente_nome, forma_pagamento, criado_em")
    .order("criado_em", { ascending: false });

  if (status && status !== "todos") query = query.eq("status", status);

  const { data: pedidos } = await query;
  const total = pedidos?.length ?? 0;
  const filtroAtual = status ?? "todos";

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">🛍️ Pedidos de venda</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{total} pedido{total !== 1 ? "s" : ""}</p>
          </div>
          <a href="/pedidos-venda/novo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Novo pedido
          </a>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTROS.map((f) => (
          <a key={f.value} href={f.value === "todos" ? "/pedidos-venda" : `/pedidos-venda?status=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filtroAtual === f.value ? "bg-amber-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
            {f.label}
          </a>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum pedido ainda</h3>
          <p className="text-zinc-500 text-sm mb-6">Crie um pedido para registrar vendas para clientes.</p>
          <a href="/pedidos-venda/novo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition">
            + Criar primeiro pedido
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pedido</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cliente</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Pagamento</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Data</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pedidos?.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3"><span className="font-mono font-semibold text-amber-700">#{p.id}</span></td>
                  <td className="px-5 py-3 font-medium text-zinc-700">{p.cliente_nome}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status] ?? "bg-zinc-100"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-zinc-500 text-xs">
                    {p.forma_pagamento ? (FORMA_LABEL[p.forma_pagamento] ?? p.forma_pagamento) : "—"}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-zinc-500 text-xs">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(p.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <a href={`/pedidos-venda/${p.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 transition">
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
