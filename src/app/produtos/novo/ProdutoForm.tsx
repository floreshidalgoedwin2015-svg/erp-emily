"use client";

import { useActionState, useState } from "react";
import { criarProduto } from "./actions";

type Categoria = { id: number; nome: string };
type Fornecedor = { id: number; nome: string };
type Variacao = {
  id: string;
  tamanho: string;
  cor: string;
  preco_custo: string;
  preco_venda: string;
  estoque_inicial: string;
  codigo_barras: string;
};

function novaVariacao(): Variacao {
  return {
    id: Math.random().toString(36).slice(2),
    tamanho: "",
    cor: "",
    preco_custo: "",
    preco_venda: "",
    estoque_inicial: "0",
    codigo_barras: "",
  };
}

const TAMANHOS = [
  "PP", "P", "M", "G", "GG", "XGG", "XXXG",
  "G1", "G2", "G3", "G4", "G5",
  "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60",
  "Único",
];

export function ProdutoForm({
  categorias,
  fornecedores,
}: {
  categorias: Categoria[];
  fornecedores: Fornecedor[];
}) {
  const [state, action, pending] = useActionState(criarProduto, undefined);
  const [variacoes, setVariacoes] = useState<Variacao[]>([novaVariacao()]);

  function adicionarVariacao() {
    setVariacoes((prev) => [...prev, novaVariacao()]);
  }

  function removerVariacao(id: string) {
    if (variacoes.length === 1) return; // mínimo 1
    setVariacoes((prev) => prev.filter((v) => v.id !== id));
  }

  function atualizarVariacao(id: string, campo: keyof Variacao, valor: string) {
    setVariacoes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [campo]: valor } : v)),
    );
  }

  // Prepara variações pra enviar como JSON
  const variacoesParaEnviar = variacoes.map((v) => ({
    tamanho: v.tamanho,
    cor: v.cor,
    codigo_barras: v.codigo_barras,
    preco_custo: parseFloat(v.preco_custo.replace(",", ".")) || 0,
    preco_venda: parseFloat(v.preco_venda.replace(",", ".")) || 0,
    estoque_inicial: parseInt(v.estoque_inicial) || 0,
  }));

  const inputClass =
    "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
  const labelClass = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <form action={action} className="space-y-8">
      {/* Campo oculto com as variações */}
      <input
        type="hidden"
        name="variacoes"
        value={JSON.stringify(variacoesParaEnviar)}
      />

      {/* ── Dados do produto ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-5">
          📝 Dados do produto
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className={labelClass}>
              Nome do produto <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              name="nome"
              required
              placeholder="Ex: Vestido Midi Floral Rosa"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="codigo" className={labelClass}>
              Código interno (SKU)
            </label>
            <input
              id="codigo"
              name="codigo"
              placeholder="Ex: VES-001 (opcional)"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="categoria_id" className={labelClass}>
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              id="categoria_id"
              name="categoria_id"
              required
              className={inputClass}
            >
              <option value="">Selecione uma categoria...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fornecedor_id" className={labelClass}>
              Fornecedor (opcional)
            </label>
            <select
              id="fornecedor_id"
              name="fornecedor_id"
              className={inputClass}
            >
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="descricao" className={labelClass}>
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={2}
              placeholder="Detalhes do produto, tecido, observações..."
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </section>

      {/* ── Variações ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-800">
              🏷️ Variações (tamanho, cor, preço)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cada tamanho/cor é uma variação com seu próprio estoque e preço.
            </p>
          </div>
          <button
            type="button"
            onClick={adicionarVariacao}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition"
          >
            + Adicionar variação
          </button>
        </div>

        <div className="space-y-3">
          {/* Cabeçalho da tabela (só desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2">
            <span className="col-span-2 text-xs font-medium text-zinc-500">Tamanho</span>
            <span className="col-span-2 text-xs font-medium text-zinc-500">Cor</span>
            <span className="col-span-2 text-xs font-medium text-zinc-500">Cód. barras</span>
            <span className="col-span-2 text-xs font-medium text-zinc-500">Custo (R$)</span>
            <span className="col-span-2 text-xs font-medium text-zinc-500">Venda (R$) *</span>
            <span className="col-span-1 text-xs font-medium text-zinc-500">Qtd.</span>
            <span className="col-span-1"></span>
          </div>

          {variacoes.map((v, idx) => (
            <div
              key={v.id}
              className="grid grid-cols-2 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100"
            >
              {/* Tamanho */}
              <div className="col-span-1 sm:col-span-2">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Tamanho</label>
                <select
                  value={v.tamanho}
                  onChange={(e) => atualizarVariacao(v.id, "tamanho", e.target.value)}
                  className={inputClass + " py-2"}
                >
                  <option value="">Selecione</option>
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Cor */}
              <div className="col-span-1 sm:col-span-2">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Cor</label>
                <input
                  type="text"
                  placeholder="Ex: Rosa"
                  value={v.cor}
                  onChange={(e) => atualizarVariacao(v.id, "cor", e.target.value)}
                  className={inputClass + " py-2"}
                />
              </div>

              {/* Código de barras */}
              <div className="col-span-2 sm:col-span-2">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Cód. barras</label>
                <input
                  type="text"
                  placeholder="(opcional)"
                  value={v.codigo_barras}
                  onChange={(e) => atualizarVariacao(v.id, "codigo_barras", e.target.value)}
                  className={inputClass + " py-2"}
                />
              </div>

              {/* Preço custo */}
              <div className="col-span-1 sm:col-span-2">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={v.preco_custo}
                  onChange={(e) => atualizarVariacao(v.id, "preco_custo", e.target.value)}
                  className={inputClass + " py-2"}
                />
              </div>

              {/* Preço venda */}
              <div className="col-span-1 sm:col-span-2">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Venda (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={v.preco_venda}
                  onChange={(e) => atualizarVariacao(v.id, "preco_venda", e.target.value)}
                  className={inputClass + " py-2"}
                  required
                />
              </div>

              {/* Estoque inicial */}
              <div className="col-span-1 sm:col-span-1">
                <label className="sm:hidden text-xs text-zinc-500 mb-1 block">Qtd.</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={v.estoque_inicial}
                  onChange={(e) => atualizarVariacao(v.id, "estoque_inicial", e.target.value)}
                  className={inputClass + " py-2"}
                />
              </div>

              {/* Botão remover */}
              <div className="col-span-1 sm:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removerVariacao(v.id)}
                  disabled={variacoes.length === 1}
                  title="Remover variação"
                  className="w-8 h-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 mt-3">
          💡 <strong>Qtd.</strong> = quantidade inicial no estoque.
          Deixe 0 se ainda não tem estoque desse item.
        </p>
      </section>

      {/* Erro */}
      {state?.erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {state.erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <a
          href="/produtos"
          className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Salvando..." : "💾 Salvar produto"}
        </button>
      </div>
    </form>
  );
}
