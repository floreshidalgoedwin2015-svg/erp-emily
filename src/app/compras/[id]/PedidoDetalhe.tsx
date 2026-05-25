"use client";

import { useState, useTransition } from "react";
import { atualizarStatusPedido } from "./actions";

type ItemPedido = {
  id: number;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_custo: number;
  subtotal: number;
};

type Pedido = {
  id: number;
  status: string;
  total: number;
  data_prevista: string | null;
  observacoes: string | null;
  criado_em: string;
  fornecedores: { nome: string } | null;
};

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-zinc-100 text-zinc-600",
  enviado: "bg-blue-100 text-blue-700",
  recebido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-500",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", recebido: "Recebido", cancelado: "Cancelado",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

export function PedidoDetalhe({ pedido, itens }: { pedido: Pedido; itens: ItemPedido[] }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [statusAtual, setStatusAtual] = useState(pedido.status);

  function mudarStatus(novoStatus: "enviado" | "recebido" | "cancelado") {
    setErro("");
    startTransition(async () => {
      const r = await atualizarStatusPedido(pedido.id, novoStatus);
      if (r.sucesso) setStatusAtual(novoStatus);
      else setErro(r.erro ?? "Erro ao atualizar.");
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-zinc-800">Pedido #{pedido.id}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[statusAtual] ?? "bg-zinc-100"}`}>
                {STATUS_LABEL[statusAtual] ?? statusAtual}
              </span>
            </div>
            <p className="text-sm text-zinc-600">
              <span className="font-medium">Fornecedor:</span>{" "}
              {(pedido.fornecedores as unknown as { nome: string } | null)?.nome ?? "—"}
            </p>
            <p className="text-sm text-zinc-500 mt-0.5">
              Criado em {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
              {pedido.data_prevista && (
                <> • Entrega prevista: {new Date(pedido.data_prevista + "T12:00:00").toLocaleDateString("pt-BR")}</>
              )}
            </p>
            {pedido.observacoes && (
              <p className="text-sm text-zinc-500 mt-1">📝 {pedido.observacoes}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Total do pedido</div>
            <div className="text-3xl font-bold text-amber-700">{fmt(pedido.total)}</div>
          </div>
        </div>

        {/* Ações por status */}
        {statusAtual !== "recebido" && statusAtual !== "cancelado" && (
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-100">
            {statusAtual === "rascunho" && (
              <button type="button" onClick={() => mudarStatus("enviado")} disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                📤 Marcar como enviado
              </button>
            )}
            {statusAtual === "enviado" && (
              <button type="button" onClick={() => mudarStatus("recebido")} disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                ✅ Confirmar recebimento
              </button>
            )}
            <button type="button" onClick={() => mudarStatus("cancelado")} disabled={isPending}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition disabled:opacity-60">
              ✕ Cancelar pedido
            </button>
            {isPending && <span className="text-sm text-zinc-400 self-center">Atualizando...</span>}
          </div>
        )}

        {statusAtual === "recebido" && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2 text-emerald-700 text-sm font-medium">
            ✅ Pedido recebido — estoque atualizado automaticamente
          </div>
        )}
      </div>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <h2 className="font-semibold text-zinc-800">📦 Itens do pedido</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Produto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase hidden sm:table-cell">Variação</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Qtd.</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase hidden md:table-cell">Custo unit.</th>
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
                <td className="px-5 py-3 text-right text-zinc-500 hidden md:table-cell">{fmt(item.preco_custo)}</td>
                <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-amber-200 bg-amber-50">
              <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-zinc-700">Total</td>
              <td className="px-5 py-3 text-right font-bold text-amber-700 text-base">{fmt(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
