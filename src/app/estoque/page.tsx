import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EntradaForm } from "./EntradaForm";

const TIPO_BADGE: Record<string, string> = {
  entrada: "bg-emerald-100 text-emerald-700",
  venda: "bg-amber-100 text-amber-700",
  ajuste: "bg-blue-100 text-blue-700",
};

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  venda: "Venda",
  ajuste: "Ajuste",
};

export default async function EstoquePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Produtos com variações para o formulário de entrada
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, codigo, variacoes ( id, tamanho, cor, estoque_atual )")
    .eq("ativo", true)
    .order("nome");

  // Histórico de movimentações (últimas 60)
  const { data: historico } = await supabase
    .from("movimentacoes_estoque")
    .select(
      `id, tipo, quantidade, estoque_antes, estoque_depois, motivo, criado_em,
       variacoes ( tamanho, cor, produtos ( nome, codigo ) )`
    )
    .order("criado_em", { ascending: false })
    .limit(60);

  return (
    <div className="p-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Início
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">
          📦 Estoque — Entrada de mercadoria
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Registre a chegada de peças novas. O estoque é atualizado na hora.
        </p>
      </div>

      {/* Formulário de entrada */}
      <EntradaForm produtos={produtos ?? []} />

      {/* Histórico */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-zinc-800 mb-4">
          📋 Histórico de movimentações
        </h2>

        {(!historico || historico.length === 0) ? (
          <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-zinc-500 text-sm">
              Nenhuma movimentação registrada ainda.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Data
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Produto
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Qtd
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                    Antes → Depois
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {historico.map((mov) => {
                  const variacao = mov.variacoes as unknown as {
                    tamanho: string | null;
                    cor: string | null;
                    produtos: { nome: string; codigo: string | null } | null;
                  } | null;

                  const produtoNome = variacao?.produtos?.nome ?? "—";
                  const varLabel =
                    [variacao?.tamanho, variacao?.cor]
                      .filter(Boolean)
                      .join(" / ") || null;

                  const data = new Date(mov.criado_em);
                  const dataFormatada = data.toLocaleDateString("pt-BR");
                  const horaFormatada = data.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const badge =
                    TIPO_BADGE[mov.tipo] ?? "bg-zinc-100 text-zinc-600";
                  const tipoLabel =
                    TIPO_LABEL[mov.tipo] ?? mov.tipo;

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="text-zinc-700 font-medium">
                          {dataFormatada}
                        </div>
                        <div className="text-xs text-zinc-400">{horaFormatada}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-800">
                          {produtoNome}
                        </div>
                        {varLabel && (
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {varLabel}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}
                        >
                          {tipoLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-bold ${
                            mov.tipo === "entrada"
                              ? "text-emerald-700"
                              : mov.tipo === "venda"
                              ? "text-amber-700"
                              : "text-zinc-700"
                          }`}
                        >
                          {mov.tipo === "entrada" ? "+" : mov.tipo === "venda" ? "−" : ""}
                          {mov.quantidade}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center hidden md:table-cell">
                        <span className="text-zinc-400 text-xs">
                          {mov.estoque_antes} → {mov.estoque_depois}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-xs text-zinc-400 truncate max-w-[180px] block">
                          {mov.motivo || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
