"use client";

import { useState, useTransition } from "react";
import { criarPedidoCompra } from "./actions";

type Fornecedor = { id: number; nome: string };
type ProdutoOpcao = {
  id: number;
  nome: string;
  variacoes: { id: number; tamanho: string | null; cor: string | null; preco_custo: number }[];
};

type ItemForm = {
  key: string;
  variacao_id: number | null;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_custo: number;
  subtotal: number;
};

const inp = "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

function descVariacao(v: { tamanho: string | null; cor: string | null }) {
  return [v.tamanho, v.cor].filter(Boolean).join(" / ") || "Único";
}

export function PedidoForm({
  fornecedores,
  produtos,
}: {
  fornecedores: Fornecedor[];
  produtos: ProdutoOpcao[];
}) {
  const [isPending, startTransition] = useTransition();

  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoOpcao | null>(null);
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [erro, setErro] = useState("");

  const produtosFiltrados = busca.length >= 2
    ? produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 8)
    : [];

  function adicionarVariacao(produto: ProdutoOpcao, v: { id: number; tamanho: string | null; cor: string | null; preco_custo: number }) {
    const key = `${produto.id}-${v.id}-${Date.now()}`;
    setItens((prev) => [
      ...prev,
      {
        key,
        variacao_id: v.id,
        produto_nome: produto.nome,
        variacao_descricao: descVariacao(v),
        quantidade: 1,
        preco_custo: v.preco_custo,
        subtotal: v.preco_custo,
      },
    ]);
    setBusca("");
    setProdutoSelecionado(null);
  }

  function atualizarItem(key: string, campo: "quantidade" | "preco_custo", valor: number) {
    setItens((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const novo = { ...i, [campo]: valor };
        novo.subtotal = novo.quantidade * novo.preco_custo;
        return novo;
      }),
    );
  }

  function removerItem(key: string) {
    setItens((prev) => prev.filter((i) => i.key !== key));
  }

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  function handleSalvar() {
    if (!fornecedorId) { setErro("Selecione um fornecedor."); return; }
    if (itens.length === 0) { setErro("Adicione pelo menos um item."); return; }
    setErro("");
    startTransition(async () => {
      await criarPedidoCompra(
        parseInt(fornecedorId),
        dataPrevista || null,
        observacoes.trim() || null,
        itens,
      );
    });
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho do pedido */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados do pedido</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={lbl}>Fornecedor <span className="text-red-500">*</span></label>
            <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inp}>
              <option value="">Selecione um fornecedor...</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Data prevista de entrega</label>
            <input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} className={inp} />
          </div>
          <div className="sm:col-span-3">
            <label className={lbl}>Observações</label>
            <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Condições de pagamento, instruções especiais..." className={inp} />
          </div>
        </div>
      </section>

      {/* Adicionar itens */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Itens do pedido</h2>

        {/* Busca de produto */}
        <div className="relative mb-4">
          <label className={lbl}>Buscar produto para adicionar</label>
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setProdutoSelecionado(null); }}
            placeholder="Digite o nome do produto..."
            className={inp}
          />
          {produtosFiltrados.length > 0 && !produtoSelecionado && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {produtosFiltrados.map((p) => (
                <button key={p.id} type="button" onClick={() => { setProdutoSelecionado(p); setBusca(p.nome); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-800 hover:bg-amber-50 transition border-b border-zinc-100 last:border-0">
                  {p.nome}
                  <span className="text-xs text-zinc-400 ml-2">({p.variacoes.length} variações)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Variações do produto selecionado */}
        {produtoSelecionado && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-zinc-700 mb-3">{produtoSelecionado.nome} — escolha a variação:</p>
            <div className="flex flex-wrap gap-2">
              {produtoSelecionado.variacoes.map((v) => (
                <button key={v.id} type="button" onClick={() => adicionarVariacao(produtoSelecionado, v)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-sm text-zinc-700 hover:bg-amber-100 transition">
                  {descVariacao(v)} <span className="text-xs text-zinc-400 ml-1">{fmt(v.preco_custo)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabela de itens */}
        {itens.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-xl">
            Busque e adicione os produtos acima
          </div>
        ) : (
          <>
            <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-2 mb-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Produto / Variação</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase">Qtd.</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase">Custo unit.</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase text-right">Subtotal</span>
              <span />
            </div>
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.key} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center bg-zinc-50 rounded-xl border border-zinc-100 p-3">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-sm font-medium text-zinc-800">{item.produto_nome}</div>
                    <div className="text-xs text-zinc-400">{item.variacao_descricao}</div>
                  </div>
                  <input type="number" min="1" value={item.quantidade}
                    onChange={(e) => atualizarItem(item.key, "quantidade", parseInt(e.target.value) || 1)}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-center w-full" />
                  <input type="number" min="0" step="0.01" value={item.preco_custo}
                    onChange={(e) => atualizarItem(item.key, "preco_custo", parseFloat(e.target.value) || 0)}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-center w-full" />
                  <div className="text-right font-semibold text-zinc-700 text-sm">{fmt(item.subtotal)}</div>
                  <button type="button" onClick={() => removerItem(item.key)}
                    className="text-zinc-300 hover:text-red-400 transition text-xl leading-none font-bold">×</button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3 text-right">
                <div className="text-xs text-zinc-500">Total do pedido</div>
                <div className="text-2xl font-bold text-amber-700">{fmt(total)}</div>
              </div>
            </div>
          </>
        )}
      </section>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      <div className="flex gap-3 justify-end pb-8">
        <a href="/compras" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Criar pedido"}
        </button>
      </div>
    </div>
  );
}
