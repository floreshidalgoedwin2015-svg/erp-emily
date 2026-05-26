import { createClient } from "@/utils/supabase/server";
import { ContaPagarForm } from "./ContaPagarForm";

export default async function NovaContaPagarPage() {
  const supabase = await createClient();
  const { data: fornecedores } = await supabase
    .from("fornecedores")
    .select("id, nome")
    .order("nome");

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/financeiro/contas-pagar" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Contas a pagar
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">💸 Nova conta a pagar</h1>
        <p className="text-zinc-500 text-sm mt-1">Registre uma despesa ou conta a vencer.</p>
      </div>
      <ContaPagarForm fornecedores={fornecedores ?? []} />
    </div>
  );
}
