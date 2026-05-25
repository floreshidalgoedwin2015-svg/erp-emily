"use client";

import { useState, useTransition } from "react";
import { registrarEntrada } from "./actions";

type VariacaoEstoque = {
  id: number;
  tamanho: string | null;
  cor: string | null;
  estoque_atual: number;
};

type ProdutoEstoque = {
  id: number;
  nome: string;
  codigo: string | null;
  variacoes: VariacaoEstoque[];
};

export function EntradaForm({ produtos }: { produtos: ProdutoEstoque[] }) {
  const [isPending, startTransition] = useTransition();

  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoEstoque | null>(null);
  const [variacaoSelecionada, setVariacaoSelecionada] =
    useState<VariacaoEstoque | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<{
    produto: string;
    variacao: string;
    qtd: number;
    estoqueNovo: number;
  } | null>(null);

  // Resultados da busca
  const resultados =
    busca.length >= 2
      ? produtos
          .filter(
            (p) =>
              p.nome.toLowerCase().includes(busca.toLowerCase()) ||
              (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
          )
          .slice(0, 8)
      : [];

  function selecionarProduto(p: ProdutoEstoque) {
    setProdutoSelecionado(p);
    setVariacaoSelecionada(null);
    setBusca(p.nome);
    setErro("");
    setSucesso(null);
  }

  function selecionarVariacao(v: VariacaoEstoque) {
    setVariacaoSelecionada(v);
    setErro("");
  }

  function limpar() {
    setBusca("");
    setProdutoSelecionado(null);
    setVariacaoSelecionada(null);
    setQuantidade("1");
    setMotivo("");
    setErro("");
  }

  function handleConfirmar() {
    if (!variacaoSelecionada) {
      setErro("Selecione uma variação.");
      return;
    }
    const qty = parseInt(quantidade);
    if (!qty || qty <= 0) {
      setErro("Quantidade inválida.");
      return;
    }

    setErro("");
    startTransition(async () => {
      const res = await registrarEntrada({
        variacao_id: variacaoSelecionada.id,
        quantidade: qty,
        motivo: motivo.trim() || "Entrada de mercadoria",
      });

      if (res.sucesso) {
        const label =
          [variacaoSelecionada.tamanho, variacaoSelecionada.cor]
            .filter(Boolean)
            .join(" / ") || "Único";
        setSucesso({
          produto: produtoSelecionado!.nome,
          variacao: label,
          qtd: qty,
          estoqueNovo: res.estoque_novo!,
        });
        limpar();
      } else {
        setErro(res.erro ?? "Erro ao registrar entrada.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Feedback de sucesso */}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">✅</span>
          <div>
            <p className="font-semibold text-emerald-800 text-sm">
              Entrada registrada!
            </p>
            <p className="text-sm text-emerald-700 mt-0.5">
              <strong>{sucesso.produto}</strong> — {sucesso.variacao}:{" "}
              <strong>+{sucesso.qtd} un.</strong> adicionadas. Estoque atual:{" "}
              <strong>{sucesso.estoqueNovo} un.</strong>
            </p>
          </div>
          <button
            onClick={() => setSucesso(null)}
            className="ml-auto text-emerald-400 hover:text-emerald-600 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Busca de produto ── */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-800 mb-4">
          🔍 Buscar produto
        </h2>
        <div className="relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              if (produtoSelecionado && e.target.value !== produtoSelecionado.nome) {
                setProdutoSelecionado(null);
                setVariacaoSelecionada(null);
              }
            }}
            placeholder="Digite o nome ou código do produto..."
            autoFocus
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          />
          {busca && (
            <button
              onClick={limpar}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xl"
            >
              ×
            </button>
          )}
        </div>

        {/* Lista de sugestões */}
        {resultados.length > 0 && !produtoSelecionado && (
          <div className="mt-2 rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            {resultados.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => selecionarProduto(p)}
                className={`w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center justify-between ${
                  idx > 0 ? "border-t border-zinc-100" : ""
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-zinc-800">
                    {p.nome}
                  </span>
                  {p.codigo && (
                    <span className="ml-2 text-xs text-zinc-400">
                      {p.codigo}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-3">
                  {p.variacoes.length} var.
                </span>
              </button>
            ))}
          </div>
        )}

        {busca.length >= 2 && resultados.length === 0 && !produtoSelecionado && (
          <p className="mt-2 text-sm text-zinc-400 text-center py-3">
            Nenhum produto encontrado para &quot;{busca}&quot;
          </p>
        )}
      </div>

      {/* ── Seleção de variação ── */}
      {produtoSelecionado && (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">
              🎨 Selecione a variação —{" "}
              <span className="text-amber-700">{produtoSelecionado.nome}</span>
            </h2>
            <button
              onClick={limpar}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition"
            >
              Trocar produto
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {produtoSelecionado.variacoes.map((v) => {
              const label =
                [v.tamanho, v.cor].filter(Boolean).join(" / ") || "Único";
              const isSelecionado = variacaoSelecionada?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => selecionarVariacao(v)}
                  className={`rounded-xl border-2 p-3 text-left transition active:scale-95 ${
                    isSelecionado
                      ? "border-amber-500 bg-amber-50"
                      : "border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="font-semibold text-sm text-zinc-800">
                    {label}
                  </div>
                  <div
                    className={`text-xs mt-1 font-medium ${
                      v.estoque_atual <= 0
                        ? "text-red-500"
                        : v.estoque_atual <= 3
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {v.estoque_atual} em estoque
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quantidade e confirmação ── */}
      {variacaoSelecionada && (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-800 mb-4">
            📥 Registrar entrada —{" "}
            <span className="text-amber-700">
              {[variacaoSelecionada.tamanho, variacaoSelecionada.cor]
                .filter(Boolean)
                .join(" / ") || "Único"}
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Quantidade */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Quantidade a adicionar *
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-32 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                autoFocus
              />
            </div>

            {/* Motivo */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Nota / motivo (opcional)
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: NF 1234, Reposição, Troca com fornecedor..."
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 text-sm text-zinc-700">
            Estoque atual:{" "}
            <strong>{variacaoSelecionada.estoque_atual} un.</strong>
            {"  →  "}
            <strong className="text-emerald-700">
              {variacaoSelecionada.estoque_atual + (parseInt(quantidade) || 0)} un.
            </strong>{" "}
            após entrada de{" "}
            <strong>{parseInt(quantidade) || 0} un.</strong>
          </div>

          {/* Erro */}
          {erro && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              ⚠️ {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setVariacaoSelecionada(null)}
              className="px-5 py-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition text-sm font-medium"
            >
              ← Voltar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? "Registrando..." : "✅ Confirmar Entrada"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
