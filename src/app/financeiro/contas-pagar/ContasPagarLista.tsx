"use client";

import { useState, useTransition } from "react";
import { marcarContaComoPaga } from "./nova/actions";

type ContaPagar = {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string;
  status: string;
  observacoes: string | null;
};

const CAT_LABEL: Record<string, string> = {
  aluguel: "🏠 Aluguel", fornecedor: "🏭 Fornecedor", utilidade: "💡 Utilidade",
  salario: "👤 Salário", imposto: "📋 Imposto", marketing: "📣 Marketing", outros: "📦 Outros",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

export function ContasPagarLista({ contas, hoje }: { contas: ContaPagar[]; hoje: string }) {
  const [isPending, startTransition] = useTransition();
  const [expandido, setExpandido] = useState<number | null>(null);
  const [dataPgto, setDataPgto] = useState(hoje);
  const [erro, setErro] = useState<Record<number, string>>({});

  function handlePagar(id: number) {
    setErro({});
    startTransition(async () => {
      const r = await marcarContaComoPaga(id, dataPgto);
      if (!r.sucesso) setErro(prev => ({ ...prev, [id]: r.erro ?? "Erro." }));
      else setExpandido(null);
    });
  }

  if (contas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-zinc-500 text-sm">Nenhuma conta neste filtro.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100">
        {["Descrição","Categoria","Vencimento","Valor","Status",""].map((h, i) => (
          <span key={i} className={`text-xs font-semibold text-zinc-500 uppercase ${i >= 3 ? "text-right" : ""}`}>{h}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-100">
        {contas.map(conta => {
          const vencida = conta.status === "pendente" && conta.data_vencimento < hoje;
          const aberta = expandido === conta.id;
          return (
            <div key={conta.id}>
              <div className={`grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-5 py-3 transition ${vencida && conta.status !== "pago" ? "bg-red-50/40" : ""}`}>
                <div>
                  <div className="text-sm font-medium text-zinc-800">{conta.descricao}</div>
                  {conta.observacoes && <div className="text-xs text-zinc-400 truncate max-w-xs">{conta.observacoes}</div>}
                </div>
                <div className="hidden sm:block text-xs text-zinc-500">{CAT_LABEL[conta.categoria] ?? conta.categoria}</div>
                <div className="hidden sm:block text-xs text-zinc-600">
                  {new Date(conta.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                  {vencida && conta.status !== "pago" && <span className="ml-1 text-red-500 font-semibold">(vencida)</span>}
                </div>
                <div className="text-right font-bold text-zinc-800 text-sm">{fmt(conta.valor)}</div>
                <div className="text-right">
                  {conta.status === "pago" ? (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">✅ Pago</span>
                  ) : (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${vencida ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {vencida ? "⚠️ Vencida" : "⏳ Pendente"}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {conta.status === "pendente" && (
                    <button type="button" onClick={() => setExpandido(aberta ? null : conta.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition font-semibold">
                      {aberta ? "✕" : "Pagar"}
                    </button>
                  )}
                </div>
              </div>
              {aberta && (
                <div className="px-5 pb-4 bg-emerald-50/50 border-t border-emerald-100">
                  <div className="flex flex-wrap gap-3 items-end pt-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Data do pagamento</label>
                      <input type="date" value={dataPgto} onChange={e => setDataPgto(e.target.value)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
                    </div>
                    <button type="button" onClick={() => handlePagar(conta.id)} disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                      {isPending ? "Salvando..." : "✅ Confirmar pagamento"}
                    </button>
                    {erro[conta.id] && <span className="text-xs text-red-600">⚠️ {erro[conta.id]}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
