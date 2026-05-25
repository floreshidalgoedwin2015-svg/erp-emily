import { createClient } from "@/utils/supabase/server";
import { PropostaForm } from "./PropostaForm";

export default async function NovaPropostaPage() {
  const supabase = await createClient();

  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, variacoes ( id, tamanho, cor, preco_venda )")
    .eq("ativo", true)
    .order("nome");

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/propostas" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Propostas
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">➕ Nova proposta comercial</h1>
        <p className="text-zinc-500 text-sm mt-1">Crie uma proposta de produtos para enviar à cliente.</p>
      </div>

      <PropostaForm
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        produtos={(produtos ?? []) as any}
      />
    </div>
  );
}
