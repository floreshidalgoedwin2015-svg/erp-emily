import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { AbrirCaixaModal } from "./CaixaControle";

const STATUS_BADGE: Record<string, string> = {
  aberto: "bg-emerald-100 text-emerald-700",
  fechado: "bg-zinc-100 text-zinc-600",
  conferido: "bg-blue-100 text-blue-700",
};
const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto", fechado: "Fechado", conferido: "Conferido",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

export default async function ControleCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const supabase = await createClient();
  const { filtro } = await searchParams;
  const filtroAtual = filtro ?? "todos";

  let query = supabase
    .from("sessoes_caixa")
    .select("id, loja, operador, data, status, saldo_abertura, saldo_fechamento, aberto_em", { count: "exact" })
    .order("aberto_em", { ascending: false })
    .limit(50);

  if (filtroAtual === "abertos") query = query.eq("status", "aberto");
  else if (filtroAtual === "fechados") query = query.eq("status", "fechado");
  else if (filtroAtual === "conferidos") query = query.eq("status", "conferido");

  const { data: sessoes, count } = await query;
  const total = count ?? 0;

  const FILTROS = [
    { value: "todos", label: "Todos" },
    { value: "abertos", label: "Abertos" },
    { value: "fechados", label: "Fechados" },
    { value: "conferidos", label: "Conferidos" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Início
        </a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">🏦 Controle de caixa</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{total} sessão{total !== 1 ? "ões" : ""} no total</p>
          </div>
          <AbrirCaixaModal />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {FILTROS.map(f => (
          <a key={f.value}
            href={f.value === "todos" ? "/financeiro/caixa" : `/financeiro/caixa?filtro=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filtroAtual === f.value ? "bg-amber-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
            {f.label}
          </a>
        ))}
      </div>

      {/* Lista de sessões */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Loja</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Operador</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Data</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Abertura</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Situação</span>
          <span />
        </div>

        {!sessoes || sessoes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏦</div>
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhuma sessão ainda</h3>
            <p className="text-zinc-500 text-sm mb-2">Clique em <strong>+ Abrir Caixa</strong> para iniciar o controle do dia.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sessoes.map(s => (
              <Link key={s.id} href={`/financeiro/caixa/${s.id}`}
                className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-5 py-4 hover:bg-amber-50/50 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-800 text-sm">{s.loja ?? "—"}</div>
                  <div className="sm:hidden text-xs text-zinc-400 mt-0.5">
                    {s.operador ?? "—"} • {new Date(s.aberto_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="hidden sm:block text-sm text-zinc-500">{s.operador ?? "—"}</div>
                <div className="hidden sm:block text-sm text-zinc-500">
                  {new Date(s.aberto_em).toLocaleDateString("pt-BR")} {new Date(s.aberto_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="hidden sm:block text-sm font-medium text-zinc-600">{fmt(s.saldo_abertura)}</div>
                <div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[s.status] ?? "bg-zinc-100"}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <div className="text-zinc-300 text-lg">›</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
