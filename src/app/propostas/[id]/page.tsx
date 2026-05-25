import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PropostaDetalhe } from "./PropostaDetalhe";

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propostaId = parseInt(id);
  if (isNaN(propostaId)) notFound();

  const supabase = await createClient();

  const { data: proposta } = await supabase
    .from("propostas")
    .select("id, status, total, cliente_nome, validade, observacoes, criado_em")
    .eq("id", propostaId)
    .single();

  if (!proposta) notFound();

  const { data: itens } = await supabase
    .from("proposta_itens")
    .select("id, produto_nome, variacao_descricao, quantidade, preco_unitario, subtotal")
    .eq("proposta_id", propostaId)
    .order("id");

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/propostas" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Propostas
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">📋 Proposta comercial</h1>
      </div>
      <PropostaDetalhe
        proposta={proposta}
        itens={itens ?? []}
      />
    </div>
  );
}
