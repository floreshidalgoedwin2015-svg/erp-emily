import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { CaixaDetalhe } from "./CaixaDetalhe";

export default async function CaixaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessaoId = parseInt(id);
  if (isNaN(sessaoId)) notFound();

  const supabase = await createClient();

  const { data: sessao } = await supabase
    .from("sessoes_caixa")
    .select("id, loja, operador, data, status, saldo_abertura, saldo_fechamento, conferencia_valores, aberto_em, fechado_em")
    .eq("id", sessaoId)
    .single();

  if (!sessao) notFound();

  // Vendas do dia pela data da sessão
  const dataInicio = sessao.data + "T00:00:00";
  const dataFim = sessao.data + "T23:59:59";

  const { data: vendas } = await supabase
    .from("pedidos_venda")
    .select("forma_pagamento, total")
    .gte("criado_em", dataInicio)
    .lte("criado_em", dataFim)
    .neq("status", "cancelado");

  // Agrupa por forma de pagamento
  const vendasPorForma: Record<string, number> = {};
  for (const v of vendas ?? []) {
    const forma = v.forma_pagamento ?? "outros";
    vendasPorForma[forma] = (vendasPorForma[forma] ?? 0) + (v.total ?? 0);
  }

  // Sangrias e suprimentos da sessão
  const { data: movimentacoes } = await supabase
    .from("movimentacoes_caixa")
    .select("id, tipo, valor, descricao, categoria, criado_em")
    .eq("sessao_id", sessaoId)
    .order("criado_em", { ascending: true });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <a href="/financeiro/caixa" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Controle de caixa
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">🏦 Controle de caixa</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {sessao.loja} — {new Date(sessao.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <CaixaDetalhe
        sessao={sessao as any}
        vendasPorForma={vendasPorForma}
        movimentacoes={movimentacoes ?? []}
      />
    </div>
  );
}
