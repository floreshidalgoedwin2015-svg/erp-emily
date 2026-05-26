import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ContasPagarLista } from "./ContasPagarLista";

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

const FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "vencida", label: "Vencidas" },
  { value: "pago", label: "Pagas" },
];

export default async function ContasPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const supabase = await createClient();
  const { filtro } = await searchParams;
  const filtroAtual = filtro ?? "todas";
  const hoje = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("contas_pagar")
    .select("id, descricao, valor, data_vencimento, data_pagamento, categoria, status, observacoes")
    .order("data_vencimento", { ascending: true });

  if (filtroAtual === "pendente") query = query.eq("status", "pendente").gte("data_vencimento", hoje);
  else if (filtroAtual === "vencida") query = query.eq("status", "pendente").lt("data_vencimento", hoje);
  else if (filtroAtual === "pago") query = query.eq("status", "pago");

  const { data: contas } = await query;
  const total = contas?.length ?? 0;

  // Resumo geral
  const { data: pendentes } = await supabase.from("contas_pagar").select("valor, data_vencimento").eq("status", "pendente");
  const totalPendente = (pendentes ?? []).reduce((s, c) => s + c.valor, 0);
  const { data: vencidas } = await supabase.from("contas_pagar").select("valor").eq("status", "pendente").lt("data_vencimento", hoje);
  const totalVencidas = (vencidas ?? []).reduce((s, c) => s + c.valor, 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">💸 Contas a pagar</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{total} conta{total !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/financeiro/contas-pagar/nova" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Nova conta
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Total a pagar</div>
          <div className="text-2xl font-bold text-amber-700">{fmt(totalPendente)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Vencidas</div>
          <div className="text-2xl font-bold text-red-600">{fmt(totalVencidas)}</div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTROS.map(f => (
          <a key={f.value} href={f.value === "todas" ? "/financeiro/contas-pagar" : `/financeiro/contas-pagar?filtro=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filtroAtual === f.value ? "bg-amber-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
            {f.label}
          </a>
        ))}
      </div>

      <ContasPagarLista contas={(contas ?? []) as any} hoje={hoje} />
    </div>
  );
}
