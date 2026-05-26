"use client";

import { useState, useTransition, useMemo } from "react";
import { transferirEstoque } from "./actions";

type Variacao = { id: number; tamanho: string | null; cor: string | null };
type Produto = { id: number; nome: string; codigo: string | null; variacoes: Variacao[] };
type Deposito = { id: number; nome: string };

type Props = {
  produtos: Produto[];
  depositos: Deposito[];
  estoqueMap: Record<string, number>; // "variacaoId_depositoId" => quantidade
};

export function TransferenciaForm({ produtos, depositos, estoqueMap }: Props) {
  const [isPending, startTransition] = useTransition();
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [variacaoId, setVariacaoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const produtoSelecionado = useMemo(
    () => produtos.find(p => p.id === Number(produtoId)),
    [produtos, produtoId]
  );

  const variacoesDoProduto = produtoSelecionado?.variacoes ?? [];

  const disponivel = origemId && variacaoId
    ? (estoqueMap[`${variacaoId}_${origemId}`] ?? 0)
    : null;

  function handleProdutoChange(val: string) {
    setProdutoId(val);
    setVariacaoId("");
  }

  function handleSubmit() {
    if (!origemId || !destinoId) { setErro("Selecione a origem e o destino."); return; }
    if (!variacaoId) { setErro("Selecione o produto e a variação."); return; }
    if (Number(quantidade) <= 0) { setErro("Quantidade deve ser maior que zero."); return; }
    setErro("");
    setSucesso(false);

    startTransition(async () => {
      const r = await transferirEstoque(
        Number(variacaoId),
        Number(origemId),
        Number(destinoId),
        Number(quantidade),
        observacao,
      );
      if (r.sucesso) {
        setSucesso(true);
        setVariacaoId("");
        setProdutoId("");
        setQuantidade("1");
        setObservacao("");
      } else {
        setErro(r.erro ?? "Erro ao transferir.");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-8">
      <h2 className="text-base font-bold text-zinc-800 mb-5">🔄 Nova transferência</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Origem */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">De (origem)</label>
          <select value={origemId} onChange={e => { setOrigemId(e.target.value); setVariacaoId(""); }}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            <option value="">Selecione o depósito...</option>
            {depositos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        {/* Destino */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Para (destino)</label>
          <select value={destinoId} onChange={e => setDestinoId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            <option value="">Selecione o depósito...</option>
            {depositos.filter(d => d.id !== Number(origemId)).map(d =>
              <option key={d.id} value={d.id}>{d.nome}</option>
            )}
          </select>
        </div>

        {/* Produto */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Produto</label>
          <select value={produtoId} onChange={e => handleProdutoChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
            <option value="">Selecione o produto...</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>
                {p.codigo ? `[${p.codigo}] ` : ""}{p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Variação */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Tamanho / Cor</label>
          <select value={variacaoId} onChange={e => setVariacaoId(e.target.value)}
            disabled={!produtoId}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50">
            <option value="">Selecione a variação...</option>
            {variacoesDoProduto.map(v => {
              const label = [v.tamanho, v.cor].filter(Boolean).join(" / ") || "Padrão";
              const disp = origemId ? (estoqueMap[`${v.id}_${origemId}`] ?? 0) : null;
              return (
                <option key={v.id} value={v.id}>
                  {label}{disp !== null ? ` — ${disp} disponível` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Quantidade
            {disponivel !== null && (
              <span className={`ml-2 font-semibold ${disponivel === 0 ? "text-red-500" : "text-emerald-600"}`}>
                (disponível: {disponivel})
              </span>
            )}
          </label>
          <input
            type="number" min="1" max={disponivel ?? undefined} value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Observação */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Observação</label>
          <input value={observacao} onChange={e => setObservacao(e.target.value)}
            placeholder="Opcional..."
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </div>

      {erro && <p className="mt-3 text-sm text-red-600">⚠️ {erro}</p>}
      {sucesso && <p className="mt-3 text-sm text-emerald-600 font-medium">✅ Transferência realizada com sucesso!</p>}

      <div className="mt-4">
        <button type="button" onClick={handleSubmit} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Transferindo..." : "🔄 Transferir"}
        </button>
      </div>
    </div>
  );
}
