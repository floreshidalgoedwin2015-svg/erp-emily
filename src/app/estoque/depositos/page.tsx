import { createClient } from "@/utils/supabase/server";
import { IncluirDepositoBtn, DepositoLinha } from "./DepositoControle";

export default async function DepositosPage() {
  const supabase = await createClient();

  const { data: depositos, count } = await supabase
    .from("depositos")
    .select("id, nome, descricao, padrao, ativo", { count: "exact" })
    .order("padrao", { ascending: false })
    .order("nome");

  const total = count ?? 0;

  return (
    <div className="p-8 max-w-3xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <a
          href="/estoque"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Estoque
        </a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">🏪 Depósitos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {total} depósito{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
            </p>
          </div>
          <IncluirDepositoBtn />
        </div>
      </div>

      {/* Informativo */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
        💡 Os depósitos representam seus locais de estoque — loja física, online, depósito em casa, etc.
        O depósito <strong>padrão</strong> é usado automaticamente nas entradas de mercadoria.
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        {!depositos || depositos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum depósito ainda</h3>
            <p className="text-zinc-500 text-sm">
              Clique em <strong>+ Incluir depósito</strong> para criar o primeiro.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {depositos.map((dep) => (
              <DepositoLinha key={dep.id} deposito={dep} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
