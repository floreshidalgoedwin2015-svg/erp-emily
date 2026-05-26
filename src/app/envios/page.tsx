import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { EnviosLista } from "./EnviosLista";

const FILTROS = [
  { value: "despachar", label: "Para despachar" },
  { value: "enviado", label: "Enviados" },
  { value: "todos", label: "Todos" },
];

export default async function EnviosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const supabase = await createClient();
  const { filtro } = await searchParams;
  const filtroAtual = filtro ?? "despachar";

  let query = supabase
    .from("pedidos_venda")
    .select("id, cliente_nome, total, status, endereco_entrega, codigo_rastreamento, servico_envio, criado_em")
    .order("criado_em", { ascending: false });

  if (filtroAtual === "despachar") {
    query = query.in("status", ["confirmado", "separando"]);
  } else if (filtroAtual === "enviado") {
    query = query.in("status", ["enviado", "entregue"]);
  } else {
    query = query.not("status", "in", '("novo","cancelado")');
  }

  const { data: pedidos } = await query;
  const total = pedidos?.length ?? 0;

  // Contagem rápida
  const { count: pendentes } = await supabase
    .from("pedidos_venda")
    .select("id", { count: "exact", head: true })
    .in("status", ["confirmado", "separando"]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">📮 Envios — Correios</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {total} pedido{total !== 1 ? "s" : ""}
              {(pendentes ?? 0) > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  {pendentes} para despachar
                </span>
              )}
            </p>
          </div>
          <Link href="/pedidos-venda/novo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Novo pedido
          </Link>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {FILTROS.map(f => (
          <a key={f.value} href={`/envios?filtro=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filtroAtual === f.value ? "bg-amber-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
            {f.label}
          </a>
        ))}
      </div>

      <EnviosLista pedidos={(pedidos ?? []) as any} />
    </div>
  );
}
