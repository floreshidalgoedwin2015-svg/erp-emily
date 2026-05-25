"use client";

import { useState, useTransition } from "react";
import { marcarComoPago } from "./nova/actions";

type Cobranca = {
  id: number;
  cliente_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  status: string;
  observacoes: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700",
  pago: "bg-emerald-100 text-emerald-700",
  vencido: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
};

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  a_prazo: "A prazo",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

function statusEfetivo(c: Cobranca): string {
  if (c.status === "pago") return "pago";
  const hoje = new Date().toISOString().split("T")[0];
  if (c.data_vencimento < hoje) return "vencido";
  return "pendente";
}

export function CobrancaLista({ cobrancas }: { cobrancas: Cobranca[] }) {
  const [registrandoId, setRegistrandoId] = useState<number | null>(null);
  const [dataPagamento, setDataPagamento] = useState<Record<number, string>>({});
  const [erros, setErros] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();

  function toggleRegistrar(id: number) {
    setRegistrandoId((prev) => (prev === id ? null : id));
    if (!dataPagamento[id]) {
      setDataPagamento((prev) => ({
        ...prev,
        [id]: new Date().toISOString().split("T")[0],
      }));
    }
  }

  function handlePagar(id: number) {
    setErros((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      const r = await marcarComoPago(id, dataPagamento[id] ?? new Date().toISOString().split("T")[0]);
      if (!r.sucesso) {
        setErros((prev) => ({ ...prev, [id]: r.erro }));
      } else {
        setRegistrandoId(null);
      }
    });
  }

  if (cobrancas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">💰</div>
        <h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhuma cobrança encontrada</h3>
        <p className="text-zinc-500 text-sm">Tente outro filtro ou crie uma nova cobrança.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-100 bg-amber-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cliente</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Descrição</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Valor</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Vencimento</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {cobrancas.map((c) => {
            const st = statusEfetivo(c);
            const hoje = new Date().toISOString().split("T")[0];
            const vencida = c.status !== "pago" && c.data_vencimento < hoje;
            return (
              <>
                <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-zinc-800">
                    {c.cliente_nome}
                    {c.observacoes && <div className="text-xs text-zinc-400 mt-0.5">{c.observacoes}</div>}
                  </td>
                  <td className="px-5 py-3 text-zinc-600 hidden sm:table-cell">{c.descricao}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(c.valor)}</td>
                  <td className={`px-5 py-3 text-center text-xs hidden md:table-cell ${vencida ? "text-red-600 font-semibold" : "text-zinc-500"}`}>
                    {new Date(c.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                    {c.forma_pagamento && <div className="text-zinc-400 font-normal mt-0.5">{FORMA_LABEL[c.forma_pagamento] ?? c.forma_pagamento}</div>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[st] ?? "bg-zinc-100"}`}>
                      {STATUS_LABEL[st] ?? st}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.status !== "pago" && (
                      <button
                        type="button"
                        onClick={() => toggleRegistrar(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
                      >
                        ✓ Registrar pagamento
                      </button>
                    )}
                    {c.status === "pago" && c.data_pagamento && (
                      <span className="text-xs text-zinc-400">
                        Pago em {new Date(c.data_pagamento + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </td>
                </tr>
                {registrandoId === c.id && (
                  <tr key={`reg-${c.id}`} className="bg-emerald-50">
                    <td colSpan={6} className="px-5 py-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-zinc-700 font-medium">Data do pagamento:</span>
                        <input
                          type="date"
                          value={dataPagamento[c.id] ?? ""}
                          onChange={(e) => setDataPagamento((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handlePagar(c.id)}
                          disabled={isPending}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {isPending ? "Salvando..." : "Confirmar pagamento"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegistrandoId(null)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-sm hover:bg-zinc-50 transition"
                        >
                          Cancelar
                        </button>
                        {erros[c.id] && <span className="text-xs text-red-600">⚠️ {erros[c.id]}</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
