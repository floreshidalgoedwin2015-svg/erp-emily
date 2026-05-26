"use client";

import { useState, useTransition } from "react";
import { abrirCaixa, fecharCaixa, adicionarMovimento } from "./actions";

type Movimentacao = {
  id: number;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  categoria: string;
  criado_em: string;
};

type SessaoCaixa = {
  id: number;
  data: string;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  status: string;
  aberto_em: string;
};

const CATS_ENTRADA = ["venda", "cobranca", "suprimento", "outros"];
const CATS_SAIDA = ["despesa", "sangria", "fornecedor", "outros"];

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

function CatLabel(cat: string) {
  const labels: Record<string, string> = {
    venda: "🛒 Venda", cobranca: "💰 Cobrança", suprimento: "➕ Suprimento",
    despesa: "💸 Despesa", sangria: "🔻 Sangria", fornecedor: "🏭 Fornecedor", outros: "📦 Outros",
  };
  return labels[cat] ?? cat;
}

export function CaixaControle({
  sessaoAtual,
  movimentacoes,
}: {
  sessaoAtual: SessaoCaixa | null;
  movimentacoes: Movimentacao[];
}) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  // Abrir caixa
  const [saldoAbertura, setSaldoAbertura] = useState("");

  // Novo movimento
  const [tipoMov, setTipoMov] = useState<"entrada" | "saida">("entrada");
  const [valorMov, setValorMov] = useState("");
  const [descMov, setDescMov] = useState("");
  const [catMov, setCatMov] = useState("venda");

  // Fechar caixa
  const [saldoFechamento, setSaldoFechamento] = useState("");
  const [mostrarFechar, setMostrarFechar] = useState(false);

  const saldoCalculado = sessaoAtual
    ? sessaoAtual.saldo_abertura +
      movimentacoes.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0) -
      movimentacoes.filter(m => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
    : 0;

  const totalEntradas = movimentacoes.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);

  function handleAbrirCaixa() {
    setErro("");
    startTransition(async () => {
      const r = await abrirCaixa(parseFloat(saldoAbertura) || 0);
      if (!r.sucesso) setErro(r.erro ?? "Erro ao abrir caixa.");
    });
  }

  function handleAdicionarMovimento() {
    setErro("");
    if (!valorMov || parseFloat(valorMov) <= 0) { setErro("Informe o valor."); return; }
    if (!descMov.trim()) { setErro("Informe a descrição."); return; }
    startTransition(async () => {
      const r = await adicionarMovimento(sessaoAtual!.id, tipoMov, parseFloat(valorMov), descMov, catMov);
      if (r.sucesso) { setValorMov(""); setDescMov(""); }
      else setErro(r.erro ?? "Erro.");
    });
  }

  function handleFecharCaixa() {
    setErro("");
    startTransition(async () => {
      const r = await fecharCaixa(sessaoAtual!.id, parseFloat(saldoFechamento) || saldoCalculado);
      if (!r.sucesso) setErro(r.erro ?? "Erro ao fechar.");
    });
  }

  // ─── SEM CAIXA ABERTO ───
  if (!sessaoAtual) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-amber-100 p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">🏦</div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-2">Caixa fechado</h2>
          <p className="text-zinc-500 text-sm mb-6">Abra o caixa para começar a registrar movimentações do dia.</p>
          <div className="max-w-xs mx-auto space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Saldo de abertura (R$)</label>
              <input type="number" min="0" step="0.01" value={saldoAbertura} onChange={e => setSaldoAbertura(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
            <button type="button" onClick={handleAbrirCaixa} disabled={isPending}
              className="w-full px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
              {isPending ? "Abrindo..." : "🔓 Abrir caixa"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CAIXA ABERTO ───
  if (sessaoAtual.status === "aberto") {
    return (
      <div className="space-y-5">
        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Abertura</div>
            <div className="text-lg font-bold text-zinc-700">{fmt(sessaoAtual.saldo_abertura)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Entradas</div>
            <div className="text-lg font-bold text-emerald-700">{fmt(totalEntradas)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Saídas</div>
            <div className="text-lg font-bold text-red-600">{fmt(totalSaidas)}</div>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Saldo atual</div>
            <div className="text-lg font-bold text-amber-700">{fmt(saldoCalculado)}</div>
          </div>
        </div>

        {/* Adicionar movimento */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Registrar movimentação</h2>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => { setTipoMov("entrada"); setCatMov("venda"); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${tipoMov === "entrada" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              ➕ Entrada
            </button>
            <button type="button" onClick={() => { setTipoMov("saida"); setCatMov("despesa"); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${tipoMov === "saida" ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              ➖ Saída
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Valor (R$)</label>
              <input type="number" min="0" step="0.01" value={valorMov} onChange={e => setValorMov(e.target.value)} placeholder="0,00"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Descrição</label>
              <input value={descMov} onChange={e => setDescMov(e.target.value)} placeholder="Ex: Venda à vista, Aluguel..."
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Categoria</label>
              <select value={catMov} onChange={e => setCatMov(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
                {(tipoMov === "entrada" ? CATS_ENTRADA : CATS_SAIDA).map(c => (
                  <option key={c} value={c}>{CatLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>
          {erro && <p className="mt-2 text-sm text-red-600">⚠️ {erro}</p>}
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={handleAdicionarMovimento} disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
              {isPending ? "Salvando..." : "✅ Registrar"}
            </button>
          </div>
        </div>

        {/* Movimentações */}
        {movimentacoes.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <h2 className="font-semibold text-zinc-800 text-sm">Movimentações do dia</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {movimentacoes.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-800">{m.descricao}</div>
                    <div className="text-xs text-zinc-400">{CatLabel(m.categoria)} • {new Date(m.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <span className={`font-bold text-sm ${m.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                    {m.tipo === "entrada" ? "+" : "-"}{fmt(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fechar caixa */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          {!mostrarFechar ? (
            <button type="button" onClick={() => { setSaldoFechamento(saldoCalculado.toFixed(2)); setMostrarFechar(true); }}
              className="text-sm font-medium text-zinc-500 hover:text-red-600 transition">
              🔒 Fechar caixa
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-700">Fechar caixa do dia</h3>
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Saldo de fechamento (R$)</label>
                  <input type="number" min="0" step="0.01" value={saldoFechamento} onChange={e => setSaldoFechamento(e.target.value)}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div className="text-xs text-zinc-500">Saldo calculado: <strong>{fmt(saldoCalculado)}</strong></div>
                <button type="button" onClick={handleFecharCaixa} disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                  {isPending ? "Fechando..." : "🔒 Confirmar fechamento"}
                </button>
                <button type="button" onClick={() => setMostrarFechar(false)} className="text-sm text-zinc-400 hover:text-zinc-600">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CAIXA FECHADO (histórico do dia) ───
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm text-center">
      <div className="text-4xl mb-3">🔒</div>
      <p className="text-zinc-600 font-medium">Caixa do dia já foi fechado.</p>
      <p className="text-zinc-500 text-sm mt-1">
        Saldo final: <strong className="text-zinc-700">{fmt(sessaoAtual.saldo_fechamento ?? 0)}</strong>
      </p>
      <p className="text-zinc-400 text-xs mt-2">Abra um novo caixa amanhã.</p>
    </div>
  );
}
