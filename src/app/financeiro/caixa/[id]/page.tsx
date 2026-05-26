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
    .select("id, loja, operador, data, status, saldo_abertura, saldo_fechamento, observacoes, aberto_em, fechado_em")
    .eq("id", sessaoId)
    .single();

  if (!sessao) notFound();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes_caixa")
    .select("id, tipo, valor, descricao, categoria, criado_em")
    .eq("sessao_id", sessaoId)
    .order("criado_em", { ascending: true });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <a href="/financeiro/caixa" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Controle de caixa
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">🏦 {sessao.loja}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {new Date(sessao.aberto_em).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {sessao.operador && <> • <span className="font-medium">{sessao.operador}</span></>}
        </p>
      </div>
      <CaixaDetalhe sessao={sessao as any} movimentacoes={movimentacoes ?? []} />
    </div>
  );
}
