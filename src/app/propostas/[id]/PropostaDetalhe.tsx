"use client";

import { useState, useTransition } from "react";
import { atualizarStatusProposta } from "./actions";

type ItemProposta = {
  id: number;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

type Proposta = {
  id: number;
  status: string;
  total: number;
  cliente_nome: string;
  validade: string | null;
  observacoes: string | null;
  criado_em: string;
};

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-zinc-100 text-zinc-600",
  enviada: "bg-blue-100 text-blue-700",
  aprovada: "bg-emerald-100 text-emerald-700",
  recusada: "bg-red-100 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  aprovada: "Aprovada",
  recusada: "Recusada",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

function fmtData(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

export function PropostaDetalhe({ proposta, itens }: { proposta: Proposta; itens: ItemProposta[] }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [statusAtual, setStatusAtual] = useState(proposta.status);
  const [copiado, setCopiado] = useState(false);

  function mudarStatus(novoStatus: "enviada" | "aprovada" | "recusada") {
    setErro("");
    startTransition(async () => {
      const r = await atualizarStatusProposta(proposta.id, novoStatus);
      if (r.sucesso) setStatusAtual(novoStatus);
      else setErro(r.erro ?? "Erro ao atualizar.");
    });
  }

  function gerarTextoWhatsApp() {
    const data = new Date(proposta.criado_em).toLocaleDateString("pt-BR");
    const linhas: string[] = [];
    linhas.push("📋 PROPOSTA - EMILY PLUS SIZE");
    linhas.push(`Cliente: ${proposta.cliente_nome}`);
    linhas.push(`Data: ${data}`);
    linhas.push("");
    linhas.push("PRODUTOS:");
    for (const item of itens) {
      const preco = "R$ " + item.subtotal.toFixed(2).replace(".", ",");
      const desc = `${item.quantidade}x ${item.produto_nome} (${item.variacao_descricao})`;
      const dots = ".".repeat(Math.max(1, 40 - desc.length));
      linhas.push(`${desc} ${dots} ${preco}`);
    }
    linhas.push("─────────────────────────");
    linhas.push(`TOTAL: ${fmt(proposta.total)}`);
    if (proposta.validade) {
      linhas.push(`Válido até: ${fmtData(proposta.validade)}`);
    }
    linhas.push("");
    linhas.push("Ficou interessada? Chama a gente! 💛");
    return linhas.join("\n");
  }

  async function copiarWhatsApp() {
    try {
      await navigator.clipboard.writeText(gerarTextoWhatsApp());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar. Tente novamente.");
    }
  }

  const podeAvancar = statusAtual !== "aprovada" && statusAtual !== "recusada";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-zinc-800">Proposta #{proposta.id}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[statusAtual] ?? "bg-zinc-100"}`}>
                {STATUS_LABEL[statusAtual] ?? statusAtual}
              </span>
            </div>
            <p className="text-sm text-zinc-700 font-medium">{proposta.cliente_nome}</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              Criado em {new Date(proposta.criado_em).toLocaleDateString("pt-BR")}
              {proposta.validade && (
                <> • Válido até: <span className="font-medium">{fmtData(proposta.validade)}</span></>
              )}
            </p>
            {proposta.observacoes && (
              <p className="text-sm text-zinc-500 mt-1">📝 {proposta.observacoes}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Total da proposta</div>
            <div className="text-3xl font-bold text-amber-700">{fmt(proposta.total)}</div>
          </div>
        </div>

        {/* Ações por status */}
        {podeAvancar && (
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-100">
            {statusAtual === "rascunho" && (
              <button type="button" onClick={() => mudarStatus("enviada")} disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                📤 Marcar como enviada
              </button>
            )}
            {statusAtual === "enviada" && (
              <>
                <button type="button" onClick={() => mudarStatus("aprovada")} disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                  ✅ Aprovada
                </button>
                <button type="button" onClick={() => mudarStatus("recusada")} disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition disabled:opacity-60">
                  ✕ Recusada
                </button>
              </>
            )}
            {isPending && <span className="text-sm text-zinc-400 self-center">Atualizando...</span>}
          </div>
        )}

        {statusAtual === "aprovada" && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2 text-emerald-700 text-sm font-medium">
            ✅ Proposta aprovada pela cliente
          </div>
        )}
        {statusAtual === "recusada" && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2 text-red-500 text-sm font-medium">
            ✕ Proposta recusada
          </div>
        )}

        {/* Botão WhatsApp */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={copiarWhatsApp}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              copiado
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
            }`}
          >
            {copiado ? "✅ Copiado!" : "📋 Copiar pro WhatsApp"}
          </button>
        </div>
      </div>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <h2 className="font-semibold text-zinc-800">📦 Produtos da proposta</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Produto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase hidden sm:table-cell">Variação</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Qtd.</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase hidden md:table-cell">Preço unit.</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {itens.map((item) => (
              <tr key={item.id} className="hover:bg-amber-50/40">
                <td className="px-5 py-3 font-medium text-zinc-800">
                  {item.produto_nome}
                  <div className="sm:hidden text-xs text-zinc-400">{item.variacao_descricao}</div>
                </td>
                <td className="px-5 py-3 text-zinc-500 hidden sm:table-cell">{item.variacao_descricao}</td>
                <td className="px-5 py-3 text-center font-semibold text-zinc-700">{item.quantidade}</td>
                <td className="px-5 py-3 text-right text-zinc-500 hidden md:table-cell">{fmt(item.preco_unitario)}</td>
                <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-amber-200 bg-amber-50">
              <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-zinc-700">Total</td>
              <td className="px-5 py-3 text-right font-bold text-amber-700 text-base">{fmt(proposta.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
