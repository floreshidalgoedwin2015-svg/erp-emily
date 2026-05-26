import { createClient } from "@/utils/supabase/server";
import { CaixaControle } from "./CaixaControle";

export default async function ControleCaixaPage() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split("T")[0];

  // Sessão de hoje
  const { data: sessao } = await supabase
    .from("sessoes_caixa")
    .select("id, data, saldo_abertura, saldo_fechamento, status, aberto_em, fechado_em")
    .eq("data", hoje)
    .maybeSingle();

  // Movimentações da sessão
  const { data: movimentacoes } = sessao
    ? await supabase
        .from("movimentacoes_caixa")
        .select("id, tipo, valor, descricao, categoria, criado_em")
        .eq("sessao_id", sessao.id)
        .order("criado_em", { ascending: true })
    : { data: [] };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <h1 className="text-2xl font-bold text-zinc-800">🏦 Controle de caixa</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <CaixaControle sessaoAtual={sessao ?? null} movimentacoes={movimentacoes ?? []} />
    </div>
  );
}
