"use client";

import { useState, useTransition } from "react";
import { salvarConferencia } from "./actions";

type VariacaoConf = {
  id: number;
  tamanho: string | null;
  cor: string | null;
  estoque_atual: number;
  produto_id: number;
  produto_nome: string;
  categoria_nome: string | null;
};

type ItemConf = VariacaoConf & { novo_estoque: number };

function descVar(v: { tamanho: string | null; cor: string | null }) {
  return [v.tamanho, v.cor].filter(Boolean).join(" / ") || "Único";
}

export function ConferenciaForm({ variacoes }: { variacoes: VariacaoConf[] }) {
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("");
  const [itens, setItens] = useState<ItemConf[]>(
    variacoes.map((v) => ({ ...v, novo_estoque: v.estoque_atual }))
  );
  const [sucesso, setSucesso] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const alterados = itens.filter((i) => i.novo_estoque !== i.estoque_atual).length;

  const itensFiltrados = filtro.trim()
    ? itens.filter((i) =>
        i.produto_nome.toLowerCase().includes(filtro.toLowerCase()) ||
        (i.categoria_nome ?? "").toLowerCase().includes(filtro.toLowerCase()) ||
        (i.tamanho ?? "").toLowerCase().includes(filtro.toLowerCase()) ||
        (i.cor ?? "").toLowerCase().includes(filtro.toLowerCase())
      )
    : itens;

  function setNovoEstoque(id: number, valor: number) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, novo_estoque: valor } : i))
    );
  }

  function handleSalvar() {
    setErro("");
    startTransition(async () => {
      const r = await salvarConferencia(
        itens.map((i) => ({ variacao_id: i.id, estoque_anterior: i.estoque_atual, estoque_novo: i.novo_estoque }))
      );
      if (r.sucesso) {
        setSucesso(r.ajustados);
        setItens((prev) => prev.map((i) => ({ ...i, estoque_atual: i.novo_estoque })));
      } else {
        setErro(r.erro ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca + status */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">🔍</span>
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por produto, cor, tamanho..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white"
          />
        </div>
        {alterados > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-700 font-semibold">{alterados} item{alterados !== 1 ? "s" : ""} alterado{alterados !== 1 ? "s" : ""}</span>
            <button type="button" onClick={handleSalvar} disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
              {isPending ? "Salvando..." : "✅ Salvar conferência"}
            </button>
          </div>
        )}
      </div>

      {sucesso !== null && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          ✅ {sucesso === 0 ? "Nenhuma alteração para salvar." : `${sucesso} variação${sucesso !== 1 ? "ões" : ""} atualizada${sucesso !== 1 ? "s" : ""} com sucesso!`}
        </div>
      )}
      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Produto</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Variação</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase">Categoria</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase text-center">Atual</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase text-center">Conferido</span>
        </div>

        {itensFiltrados.length === 0 ? (
          <div className="p-10 text-center text-zinc-400 text-sm">Nenhum item encontrado.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {itensFiltrados.map((item) => {
              const alterado = item.novo_estoque !== item.estoque_atual;
              const diff = item.novo_estoque - item.estoque_atual;
              return (
                <div key={item.id}
                  className={`grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 items-center px-5 py-3 transition ${alterado ? "bg-amber-50" : ""}`}>
                  {/* Produto */}
                  <div>
                    <div className="font-medium text-zinc-800 text-sm">{item.produto_nome}</div>
                    <div className="sm:hidden text-xs text-zinc-400 mt-0.5">{descVar(item)}</div>
                  </div>
                  {/* Variação */}
                  <div className="hidden sm:block text-sm text-zinc-500">{descVar(item)}</div>
                  {/* Categoria */}
                  <div className="hidden sm:block text-xs text-zinc-400">{item.categoria_nome ?? "—"}</div>
                  {/* Estoque atual */}
                  <div className="text-center">
                    <span className={`font-semibold text-sm ${item.estoque_atual === 0 ? "text-red-500" : item.estoque_atual <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
                      {item.estoque_atual}
                    </span>
                    {alterado && (
                      <div className={`text-xs font-medium ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </div>
                    )}
                  </div>
                  {/* Novo estoque */}
                  <div className="flex justify-center">
                    <input
                      type="number"
                      min="0"
                      value={item.novo_estoque}
                      onChange={(e) => setNovoEstoque(item.id, parseInt(e.target.value) || 0)}
                      className={`w-20 text-center rounded-lg border py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${alterado ? "border-amber-400 bg-amber-50 text-amber-800" : "border-zinc-200 bg-white text-zinc-700"}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {alterados > 0 && (
        <div className="flex justify-end pb-8">
          <button type="button" onClick={handleSalvar} disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
            {isPending ? "Salvando..." : `✅ Salvar ${alterados} alteração${alterados !== 1 ? "ões" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
