"use client";

import { useState, useTransition } from "react";
import { finalizarVenda } from "./actions";

type VariacaoPDV = {
  id: number;
  tamanho: string | null;
  cor: string | null;
  preco_venda: number;
  estoque_atual: number;
};

type ProdutoPDV = {
  id: number;
  nome: string;
  codigo: string | null;
  variacoes: VariacaoPDV[];
};

type ListaPreco = {
  id: number;
  nome: string;
  itens: { produto_id: number; preco: number }[];
};

type ItemCarrinho = {
  key: string;
  variacao_id: number;
  produto_id: number;
  produto_nome: string;
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

type Aba = "produto" | "cliente" | "pagamento";

const FORMAS_PAGAMENTO = [
  { value: "pix", label: "PIX", icon: "💠" },
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "debito", label: "Débito", icon: "💳" },
  { value: "credito", label: "Crédito", icon: "💳" },
  { value: "misto", label: "Misto", icon: "🔀" },
];

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

export function PDVCaixa({
  produtos,
  listasPrecos,
}: {
  produtos: ProdutoPDV[];
  listasPrecos: ListaPreco[];
}) {
  const [isPending, startTransition] = useTransition();
  const [aba, setAba] = useState<Aba>("produto");

  // busca produto
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoPDV | null>(null);
  const [listaId, setListaId] = useState<number | "">("");

  // carrinho
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // cliente
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  // pagamento
  const [desconto, setDesconto] = useState("0");
  const [formaPagamento, setFormaPagamento] = useState("");

  // feedback
  const [erro, setErro] = useState("");
  const [vendaFinalizada, setVendaFinalizada] = useState<{
    numero: number;
    total: number;
  } | null>(null);

  // ── Cálculos ──
  const subtotal = carrinho.reduce((s, i) => s + i.subtotal, 0);
  const descontoNum = parseFloat(desconto.replace(",", ".")) || 0;
  const total = Math.max(0, subtotal - descontoNum);

  // ── Lista de preço selecionada ──
  const listaSelecionada = listasPrecos.find((l) => l.id === listaId) ?? null;

  function precoComLista(produto_id: number, precoBase: number): number {
    if (!listaSelecionada) return precoBase;
    const item = listaSelecionada.itens.find((i) => i.produto_id === produto_id);
    return item ? item.preco : precoBase;
  }

  // ── Busca ──
  const resultados =
    busca.length >= 2
      ? produtos
          .filter(
            (p) =>
              p.nome.toLowerCase().includes(busca.toLowerCase()) ||
              (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
          )
          .slice(0, 10)
      : [];

  // ── Funções do carrinho ──
  function adicionarAoCarrinho(v: VariacaoPDV, produto: ProdutoPDV) {
    const preco = precoComLista(produto.id, v.preco_venda);
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.variacao_id === v.id);
      if (existe) {
        return prev.map((i) =>
          i.variacao_id === v.id
            ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.preco_unitario }
            : i
        );
      }
      return [
        ...prev,
        {
          key: Math.random().toString(36).slice(2),
          variacao_id: v.id,
          produto_id: produto.id,
          produto_nome: produto.nome,
          tamanho: v.tamanho,
          cor: v.cor,
          quantidade: 1,
          preco_unitario: preco,
          subtotal: preco,
        },
      ];
    });
    setProdutoSelecionado(null);
    setBusca("");
    setErro("");
  }

  function remover(key: string) {
    setCarrinho((prev) => prev.filter((i) => i.key !== key));
  }

  function ajustarQty(key: string, delta: number) {
    setCarrinho((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const qty = Math.max(1, i.quantidade + delta);
        return { ...i, quantidade: qty, subtotal: qty * i.preco_unitario };
      })
    );
  }

  function limpar() {
    setCarrinho([]);
    setDesconto("0");
    setFormaPagamento("");
    setClienteNome("");
    setClienteTelefone("");
    setBusca("");
    setProdutoSelecionado(null);
    setErro("");
    setVendaFinalizada(null);
    setAba("produto");
  }

  function avancarAba() {
    if (aba === "produto") {
      if (carrinho.length === 0) {
        setErro("Adicione pelo menos 1 produto.");
        return;
      }
      setErro("");
      setAba("cliente");
    } else if (aba === "cliente") {
      setAba("pagamento");
    }
  }

  function handleFinalizar() {
    if (carrinho.length === 0) {
      setErro("Carrinho vazio.");
      return;
    }
    if (!formaPagamento) {
      setErro("Selecione a forma de pagamento.");
      return;
    }
    setErro("");

    startTransition(async () => {
      const res = await finalizarVenda({
        itens: carrinho.map((i) => ({
          variacao_id: i.variacao_id,
          produto_nome: i.produto_nome,
          tamanho: i.tamanho,
          cor: i.cor,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          subtotal: i.subtotal,
        })),
        subtotal,
        desconto: descontoNum,
        total,
        forma_pagamento: formaPagamento,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
      });

      if (res.sucesso) {
        setVendaFinalizada({ numero: res.numero_venda!, total });
      } else {
        setErro(res.erro ?? "Erro ao finalizar venda.");
      }
    });
  }

  // ── Tela de sucesso ──
  if (vendaFinalizada) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl shadow-2xl p-12 text-center max-w-sm w-full">
          <div className="text-7xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-1">Venda finalizada!</h2>
          <p className="text-zinc-400 mb-3">
            Venda{" "}
            <span className="font-mono font-bold text-amber-400">
              #{vendaFinalizada.numero}
            </span>
          </p>
          <p className="text-4xl font-bold text-amber-400 mb-8">
            {fmt(vendaFinalizada.total)}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={limpar}
              className="flex-1 py-3 rounded-2xl bg-amber-500 text-zinc-900 font-bold text-base hover:bg-amber-400 transition"
            >
              🛒 Nova venda
            </button>
            <a
              href="/dashboard"
              className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-300 font-medium text-base hover:bg-zinc-800 transition text-center"
            >
              🏠 Início
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">

      {/* ── Barra superior ── */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-zinc-500 hover:text-amber-400 text-sm transition">
            ← Início
          </a>
          <span className="text-zinc-700">|</span>
          <h1 className="font-bold text-white text-base">
            🛒 PDV — Frente de Caixa
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {carrinho.length > 0 && (
            <span className="text-xs text-zinc-400">
              {carrinho.length} item{carrinho.length !== 1 ? "s" : ""} no carrinho
            </span>
          )}
          <span className="text-amber-400 font-bold text-base">
            {fmt(total)}
          </span>
        </div>
      </header>

      {/* ── Abas ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 flex gap-1 shrink-0">
        {(["produto", "cliente", "pagamento"] as Aba[]).map((a, idx) => {
          const labels = ["Produto", "Cliente", "Pagamento"];
          const isAtivo = aba === a;
          const isConcluido =
            (a === "produto" && (aba === "cliente" || aba === "pagamento")) ||
            (a === "cliente" && aba === "pagamento");
          return (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
                isAtivo
                  ? "border-amber-400 text-amber-400"
                  : isConcluido
                  ? "border-transparent text-zinc-500 hover:text-zinc-300"
                  : "border-transparent text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <span className="mr-1.5 text-xs opacity-60">{idx + 1}.</span>
              {labels[idx]}
            </button>
          );
        })}
      </div>

      {/* ── Conteúdo principal ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── ESQUERDA ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-zinc-950">

          {/* ── ABA: PRODUTO ── */}
          {aba === "produto" && (
            <div className="p-4 space-y-3 flex-1">
              {/* Filtros */}
              <div className="flex gap-2">
                {/* Lista de preço */}
                {listasPrecos.length > 0 && (
                  <select
                    value={listaId}
                    onChange={(e) =>
                      setListaId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 w-52 shrink-0"
                  >
                    <option value="">Preço padrão</option>
                    {listasPrecos.map((l) => (
                      <option key={l.id} value={l.id}>
                        💲 {l.nome}
                      </option>
                    ))}
                  </select>
                )}

                {/* Busca */}
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      setProdutoSelecionado(null);
                    }}
                    placeholder="Pesquise por nome ou código..."
                    autoFocus
                    className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  {busca && (
                    <button
                      onClick={() => {
                        setBusca("");
                        setProdutoSelecionado(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xl leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Resultados da busca */}
              {resultados.length > 0 && !produtoSelecionado && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
                  {resultados.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setProdutoSelecionado(p)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition flex items-center justify-between ${
                        idx > 0 ? "border-t border-zinc-800" : ""
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium text-white">
                          {p.nome}
                        </span>
                        {p.codigo && (
                          <span className="ml-2 text-xs text-zinc-500">
                            {p.codigo}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0 ml-3">
                        {p.variacoes.length} variação
                        {p.variacoes.length !== 1 ? "ões" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {busca.length >= 2 && resultados.length === 0 && !produtoSelecionado && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 text-center text-zinc-500 text-sm">
                  Nenhum produto encontrado para &quot;{busca}&quot;
                </div>
              )}

              {/* Seletor de variações */}
              {produtoSelecionado && (
                <div className="bg-zinc-900 rounded-xl border border-amber-500/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">
                      {produtoSelecionado.nome}
                    </h3>
                    <button
                      onClick={() => setProdutoSelecionado(null)}
                      className="text-zinc-500 hover:text-zinc-300 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800"
                    >
                      ×
                    </button>
                  </div>
                  {listaSelecionada && (
                    <p className="text-xs text-amber-400 mb-2">
                      💲 Aplicando preço da lista: {listaSelecionada.nome}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {produtoSelecionado.variacoes.map((v) => {
                      const semEstoque = v.estoque_atual <= 0;
                      const label =
                        [v.tamanho, v.cor].filter(Boolean).join(" / ") ||
                        "Único";
                      const preco = precoComLista(
                        produtoSelecionado!.id,
                        v.preco_venda
                      );
                      return (
                        <button
                          key={v.id}
                          disabled={semEstoque}
                          onClick={() =>
                            adicionarAoCarrinho(v, produtoSelecionado!)
                          }
                          className={`rounded-xl border-2 p-3 text-left transition active:scale-95 ${
                            semEstoque
                              ? "border-zinc-800 opacity-30 cursor-not-allowed"
                              : "border-zinc-700 hover:border-amber-400 hover:bg-zinc-800"
                          }`}
                        >
                          <div className="font-semibold text-sm text-white">
                            {label}
                          </div>
                          <div className="text-amber-400 font-bold text-sm mt-1">
                            {fmt(preco)}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              semEstoque ? "text-red-500" : "text-zinc-500"
                            }`}
                          >
                            {semEstoque
                              ? "Sem estoque"
                              : `${v.estoque_atual} em estoque`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estado vazio */}
              {carrinho.length === 0 &&
                !produtoSelecionado &&
                busca.length < 2 && (
                  <div className="flex-1 flex items-center justify-center py-24 text-center">
                    <div>
                      <div className="text-6xl mb-3 opacity-30">🛍️</div>
                      <p className="text-zinc-600 text-sm">
                        Pesquise um produto para começar
                      </p>
                    </div>
                  </div>
                )}

              {/* Botão avançar para Cliente */}
              {carrinho.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={avancarAba}
                    className="w-full py-3 rounded-xl bg-amber-500 text-zinc-900 font-bold hover:bg-amber-400 transition"
                  >
                    Avançar para Cliente →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ABA: CLIENTE ── */}
          {aba === "cliente" && (
            <div className="p-6 space-y-4 max-w-lg">
              <h2 className="text-white font-semibold text-lg mb-4">
                👤 Dados do cliente
              </h2>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nome do cliente (opcional)
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Ex: Maria das Graças"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 text-white px-4 py-3 text-sm focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Telefone (opcional)
                </label>
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 text-white px-4 py-3 text-sm focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAba("produto")}
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition text-sm font-medium"
                >
                  ← Voltar
                </button>
                <button
                  onClick={avancarAba}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-900 font-bold hover:bg-amber-400 transition"
                >
                  Avançar para Pagamento →
                </button>
              </div>
            </div>
          )}

          {/* ── ABA: PAGAMENTO ── */}
          {aba === "pagamento" && (
            <div className="p-6 space-y-5 max-w-lg">
              <h2 className="text-white font-semibold text-lg">
                💰 Forma de pagamento
              </h2>

              {/* Desconto */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="w-40 rounded-xl border border-zinc-700 bg-zinc-900 text-white px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Formas de pagamento */}
              <div className="grid grid-cols-3 gap-2">
                {FORMAS_PAGAMENTO.map((fp) => (
                  <button
                    key={fp.value}
                    onClick={() => setFormaPagamento(fp.value)}
                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition flex flex-col items-center gap-1 ${
                      formaPagamento === fp.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="text-xl">{fp.icon}</span>
                    <span>{fp.label}</span>
                  </button>
                ))}
              </div>

              {/* Erro */}
              {erro && (
                <div className="rounded-xl bg-red-900/30 border border-red-700 px-4 py-2 text-sm text-red-400">
                  ⚠️ {erro}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setAba("cliente")}
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition text-sm font-medium"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleFinalizar}
                  disabled={isPending || !formaPagamento}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-900 font-bold text-base hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {isPending ? "Processando..." : "✅ Finalizar Venda"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── DIREITA: Carrinho ── */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-300 text-sm">
              🛍️ Pedido{" "}
              {carrinho.length > 0 && (
                <span className="text-amber-400">({carrinho.length})</span>
              )}
            </h2>
            {carrinho.length > 0 && (
              <button
                onClick={() => setCarrinho([])}
                className="text-xs text-zinc-600 hover:text-red-400 transition"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Itens */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800">
            {carrinho.length === 0 ? (
              <div className="p-6 text-center text-zinc-700 text-sm">
                Nenhum pedido cadastrado
              </div>
            ) : (
              carrinho.map((item) => (
                <div key={item.key} className="px-4 py-3 flex gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white leading-tight truncate">
                      {item.produto_nome}
                    </div>
                    {(item.tamanho || item.cor) && (
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {[item.tamanho, item.cor].filter(Boolean).join(" / ")}
                      </div>
                    )}
                    <div className="text-xs text-zinc-600 mt-0.5">
                      {fmt(item.preco_unitario)} un.
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => ajustarQty(item.key, -1)}
                        className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm flex items-center justify-center transition"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-white">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => ajustarQty(item.key, 1)}
                        className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-amber-400 text-sm">
                      {fmt(item.subtotal)}
                    </div>
                    <button
                      onClick={() => remover(item.key)}
                      className="text-zinc-700 hover:text-red-400 text-base leading-none transition"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="border-t border-zinc-800 p-4 space-y-2 shrink-0">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {descontoNum > 0 && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Desconto</span>
                <span className="text-red-400">− {fmt(descontoNum)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1 border-t border-zinc-800">
              <span className="text-zinc-300">Total</span>
              <span className="text-amber-400">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
