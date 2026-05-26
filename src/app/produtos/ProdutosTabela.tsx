"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  mudarSituacaoProdutos,
  reajustarPrecosProdutos,
  vincularProdutosALista,
} from "./actions-bulk";

type Variacao = { id: number; estoque_atual: number; preco_venda: number };
type Produto = {
  id: number;
  nome: string;
  codigo: string | null;
  foto_url: string | null;
  ativo: boolean;
  variacoes: Variacao[];
  categorias: { nome: string } | null;
};
type Lista = { id: number; nome: string };

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

function estoqueTotal(p: Produto) {
  return p.variacoes.reduce((a, v) => a + (v.estoque_atual ?? 0), 0);
}
function precoStr(p: Produto) {
  const precos = p.variacoes.map(v => v.preco_venda).filter(x => x > 0);
  if (!precos.length) return "—";
  const min = Math.min(...precos), max = Math.max(...precos);
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

/* ── Modal: Reajuste de preços ─────────────────────────── */
function ModalReajuste({ ids, onFechar, onSucesso }: { ids: number[]; onFechar: () => void; onSucesso: () => void }) {
  const [tipo, setTipo] = useState<"acrescimo" | "desconto">("acrescimo");
  const [pct, setPct] = useState("10");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSalvar() {
    const v = parseFloat(pct);
    if (isNaN(v) || v <= 0 || v > 100) { setErro("Percentual entre 1 e 100."); return; }
    setErro("");
    startTransition(async () => {
      const r = await reajustarPrecosProdutos(ids, v, tipo);
      if (r.sucesso) onSucesso();
      else setErro(r.erro ?? "Erro.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-zinc-800">📈 Reajustar preços</h2>
          <button onClick={onFechar} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Aplicar reajuste em <strong>{ids.length} produto{ids.length !== 1 ? "s" : ""}</strong>.
        </p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setTipo("acrescimo")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${tipo === "acrescimo" ? "bg-emerald-600 text-white border-emerald-600" : "border-zinc-200 text-zinc-600 hover:border-emerald-300"}`}>
              ▲ Acréscimo
            </button>
            <button type="button" onClick={() => setTipo("desconto")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${tipo === "desconto" ? "bg-red-500 text-white border-red-500" : "border-zinc-200 text-zinc-600 hover:border-red-300"}`}>
              ▼ Desconto
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Percentual (%)</label>
            <input type="number" min="0.1" max="100" step="0.1" value={pct} onChange={e => setPct(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onFechar} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
              {isPending ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal: Vincular lista ─────────────────────────────── */
function ModalVincularLista({ ids, listas, onFechar, onSucesso }: { ids: number[]; listas: Lista[]; onFechar: () => void; onSucesso: () => void }) {
  const [listaId, setListaId] = useState(listas[0]?.id?.toString() ?? "");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSalvar() {
    if (!listaId) { setErro("Selecione uma lista."); return; }
    setErro("");
    startTransition(async () => {
      const r = await vincularProdutosALista(ids, Number(listaId));
      if (r.sucesso) onSucesso();
      else setErro(r.erro ?? "Erro.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-zinc-800">💲 Vincular a lista de preço</h2>
          <button onClick={onFechar} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          <strong>{ids.length} produto{ids.length !== 1 ? "s" : ""}</strong> serão adicionados com seus preços atuais.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Lista de preço</label>
            {listas.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma lista cadastrada. <Link href="/listas-precos" className="text-amber-700 underline">Criar lista</Link></p>
            ) : (
              <select value={listaId} onChange={e => setListaId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            )}
          </div>
          {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onFechar} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={isPending || listas.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
              {isPending ? "Vinculando..." : "Vincular"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal: Mudar situação ─────────────────────────────── */
function ModalSituacao({ ids, onFechar, onSucesso }: { ids: number[]; onFechar: () => void; onSucesso: () => void }) {
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSalvar() {
    startTransition(async () => {
      const r = await mudarSituacaoProdutos(ids, ativo);
      if (r.sucesso) onSucesso();
      else setErro(r.erro ?? "Erro.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-zinc-800">📋 Mudar situação</h2>
          <button onClick={onFechar} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Alterar situação de <strong>{ids.length} produto{ids.length !== 1 ? "s" : ""}</strong>.
        </p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setAtivo(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${ativo ? "bg-emerald-600 text-white border-emerald-600" : "border-zinc-200 text-zinc-600 hover:border-emerald-300"}`}>
              ✅ Ativar
            </button>
            <button type="button" onClick={() => setAtivo(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${!ativo ? "bg-zinc-600 text-white border-zinc-600" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>
              ⛔ Desativar
            </button>
          </div>
          {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onFechar} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button onClick={handleSalvar} disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
              {isPending ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tabela principal ──────────────────────────────────── */
export function ProdutosTabela({ produtos, listas }: { produtos: Produto[]; listas: Lista[] }) {
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [modal, setModal] = useState<"reajuste" | "lista" | "situacao" | null>(null);
  const [sucesso, setSucesso] = useState("");

  const todosIds = produtos.map(p => p.id);
  const todosSelecionados = selecionados.size === produtos.length && produtos.length > 0;

  function toggleTodos() {
    if (todosSelecionados) setSelecionados(new Set());
    else setSelecionados(new Set(todosIds));
  }

  function toggleUm(id: number) {
    setSelecionados(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function exportarCSV() {
    const sel = produtos.filter(p => selecionados.has(p.id));
    const linhas = [
      ["Nome", "Código", "Variações", "Estoque Total", "Preço"],
      ...sel.map(p => [p.nome, p.codigo ?? "", p.variacoes.length, estoqueTotal(p), precoStr(p)]),
    ];
    const csv = "﻿" + linhas.map(l => l.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "produtos.csv"; a.click();
    URL.revokeObjectURL(url);
    setDropdownAberto(false);
  }

  const idsArray = Array.from(selecionados);
  const qtdSel = selecionados.size;

  function handleSucesso(msg: string) {
    setModal(null);
    setDropdownAberto(false);
    setSelecionados(new Set());
    setSucesso(msg);
    setTimeout(() => setSucesso(""), 4000);
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="flex items-center justify-between mb-3 min-h-[36px]">
        <div className="text-sm text-zinc-500">
          {qtdSel > 0 ? (
            <span className="font-semibold text-amber-700">{qtdSel} produto{qtdSel !== 1 ? "s" : ""} selecionado{qtdSel !== 1 ? "s" : ""}</span>
          ) : (
            <span>Selecione produtos para ações em massa</span>
          )}
        </div>

        {/* Mais ações */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownAberto(v => !v)}
            disabled={qtdSel === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:border-amber-300 hover:text-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            Mais ações ▾
          </button>

          {dropdownAberto && qtdSel > 0 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownAberto(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl shadow-xl border border-zinc-200 py-1 w-56">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Planilhas</div>
                <button onClick={exportarCSV}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition">
                  📊 Exportar dados para Excel
                </button>

                <div className="border-t border-zinc-100 my-1" />
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Edição</div>
                <button onClick={() => { setModal("reajuste"); setDropdownAberto(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition">
                  📈 Reajuste de preços
                </button>
                <Link href="/estoque/transferencias"
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition">
                  🔄 Transferir estoque
                </Link>
                <button onClick={() => { setModal("situacao"); setDropdownAberto(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition">
                  📋 Mudar situação
                </button>

                <div className="border-t border-zinc-100 my-1" />
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Listas de Preços</div>
                <button onClick={() => { setModal("lista"); setDropdownAberto(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition">
                  💲 Vincular a uma lista
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {sucesso && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
          ✅ {sucesso}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-100 bg-amber-50">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16">Imagem</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Código</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Preço</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Estoque</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {produtos.map((produto) => {
              const est = estoqueTotal(produto);
              const preco = precoStr(produto);
              const selecionado = selecionados.has(produto.id);

              return (
                <tr key={produto.id}
                  className={`transition-colors ${selecionado ? "bg-amber-50/60" : "hover:bg-amber-50/40"}`}>
                  <td className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selecionado} onChange={() => toggleUm(produto.id)}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 w-16">
                    {produto.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={produto.foto_url} alt={produto.nome} className="w-12 h-12 object-cover rounded-lg border border-zinc-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-xl">👗</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-800 leading-snug">
                      {produto.nome}
                      {produto.variacoes.length > 1 && (
                        <span className="ml-2 text-xs text-zinc-400 font-normal">({produto.variacoes.length} variações)</span>
                      )}
                    </div>
                    {produto.categorias?.nome && (
                      <div className="text-xs text-zinc-400 mt-0.5">{produto.categorias.nome}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-zinc-500 font-mono text-xs">{produto.codigo || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-zinc-700 font-medium text-xs">{preco}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className={`font-semibold text-sm ${est === 0 ? "text-red-500" : est <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                      {est}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/produtos/${produto.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 transition">
                      ✏️ Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modais */}
      {modal === "reajuste" && (
        <ModalReajuste ids={idsArray} onFechar={() => setModal(null)}
          onSucesso={() => handleSucesso("Preços reajustados com sucesso!")} />
      )}
      {modal === "lista" && (
        <ModalVincularLista ids={idsArray} listas={listas} onFechar={() => setModal(null)}
          onSucesso={() => handleSucesso("Produtos vinculados à lista com sucesso!")} />
      )}
      {modal === "situacao" && (
        <ModalSituacao ids={idsArray} onFechar={() => setModal(null)}
          onSucesso={() => handleSucesso("Situação alterada com sucesso!")} />
      )}
    </>
  );
}
