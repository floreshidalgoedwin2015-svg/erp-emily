"use client";

import { useState, useTransition } from "react";
import { fecharCaixa, conferirCaixa, adicionarMovimento } from "../actions";

type Movimentacao = { id: number; tipo: "entrada" | "saida"; valor: number; descricao: string; categoria: string; criado_em: string };
type Sessao = { id: number; loja: string; operador: string | null; data: string; status: string; saldo_abertura: number; saldo_fechamento: number | null; observacoes: string | null; aberto_em: string; fechado_em: string | null };

const CATS_ENTRADA = ["venda", "cobranca", "suprimento", "outros"];
const CATS_SAIDA = ["despesa", "sangria", "fornecedor", "outros"];
const CAT_LABEL: Record<string, string> = {
  venda: "🛒 Venda", cobranca: "💰 Cobrança", suprimento: "➕ Suprimento",
  despesa: "💸 Despesa", sangria: "🔻 Sangria", fornecedor: "🏭 Fornecedor", outros: "📦 Outros",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

export function CaixaDetalhe({ sessao, movimentacoes }: { sessao: Sessao; movimentacoes: Movimentacao[] }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  // Novo movimento
  const [tipoMov, setTipoMov] = useState<"entrada" | "saida">("entrada");
  const [valorMov, setValorMov] = useState("");
  const [descMov, setDescMov] = useState("");
  const [catMov, setCatMov] = useState("venda");

  // Fechar
  const [saldoFechamento, setSaldoFechamento] = useState("");
  const [mostrarFechar, setMostrarFechar] = useState(false);

  const totalEntradas = movimentacoes.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
  const saldoCalculado = sessao.saldo_abertura + totalEntradas - totalSaidas;

  function handleAdicionarMovimento() {
    if (!valorMov || parseFloat(valorMov) <= 0) { setErro("Informe o valor."); return; }
    if (!descMov.trim()) { setErro("Informe a descrição."); return; }
    setErro("");
    startTransition(async () => {
      const r = await adicionarMovimento(sessao.id, tipoMov, parseFloat(valorMov), descMov, catMov);
      if (r.sucesso) { setValorMov(""); setDescMov(""); }
      else setErro(r.erro ?? "Erro.");
    });
  }

  function handleFecharCaixa() {
    setErro("");
    startTransition(async () => {
      const r = await fecharCaixa(sessao.id, parseFloat(saldoFechamento) || saldoCalculado);
      if (!r.sucesso) setErro(r.erro ?? "Erro ao fechar.");
    });
  }

  function handleConferir() {
    setErro("");
    startTransition(async () => {
      const r = await conferirCaixa(sessao.id);
      if (!r.sucesso) setErro(r.erro ?? "Erro.");
    });
  }

  const STATUS_BADGE: Record<string, string> = {
    aberto: "bg-emerald-100 text-emerald-700",
    fechado: "bg-zinc-100 text-zinc-600",
    conferido: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-700">Resumo da sessão</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[sessao.status] ?? "bg-zinc-100 text-zinc-600"}`}>
            {sessao.status === "aberto" ? "Aberto" : sessao.status === "fechado" ? "Fechado" : "Conferido"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Abertura</div>
            <div className="text-lg font-bold text-zinc-700">{fmt(sessao.saldo_abertura)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Entradas</div>
            <div className="text-lg font-bold text-emerald-600">{fmt(totalEntradas)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Saídas</div>
            <div className="text-lg font-bold text-red-500">{fmt(totalSaidas)}</div>
          </div>
          <div className="text-center bg-amber-50 rounded-xl p-2">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-1">Saldo atual</div>
            <div className="text-lg font-bold text-amber-700">{fmt(sessao.saldo_fechamento ?? saldoCalculado)}</div>
          </div>
        </div>
        {sessao.observacoes && <p className="mt-3 text-sm text-zinc-500">📝 {sessao.observacoes}</p>}
      </div>

      {/* Ações por status */}
      {sessao.status === "aberto" && (
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
              <input value={descMov} onChange={e => setDescMov(e.target.value)} placeholder="Ex: Venda à vista..."
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Categoria</label>
              <select value={catMov} onChange={e => setCatMov(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
                {(tipoMov === "entrada" ? CATS_ENTRADA : CATS_SAIDA).map(c => (
                  <option key={c} value={c}>{CAT_LABEL[c]}</option>
                ))}
              </select>
            </div>
          </div>
          {erro && <p className="mt-2 text-sm text-red-600">⚠️ {erro}</p>}
          <div className="mt-3 flex justify-between items-center">
            <button type="button" onClick={() => setMostrarFechar(!mostrarFechar)}
              className="text-sm text-zinc-400 hover:text-red-600 transition">🔒 Fechar caixa</button>
            <button type="button" onClick={handleAdicionarMovimento} disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
              {isPending ? "Salvando..." : "✅ Registrar"}
            </button>
          </div>
          {mostrarFechar && (
            <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Saldo de fechamento (R$)</label>
                <input type="number" min="0" step="0.01"
                  value={saldoFechamento || saldoCalculado.toFixed(2)}
                  onChange={e => setSaldoFechamento(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <button type="button" onClick={handleFecharCaixa} disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {isPending ? "Fechando..." : "🔒 Confirmar fechamento"}
              </button>
            </div>
          )}
        </div>
      )}

      {sessao.status === "fechado" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Fechado em {sessao.fechado_em ? new Date(sessao.fechado_em).toLocaleString("pt-BR") : "—"}
          </div>
          <button type="button" onClick={handleConferir} disabled={isPending}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
            {isPending ? "..." : "✅ Conferir caixa"}
          </button>
        </div>
      )}

      {sessao.status === "conferido" && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-sm text-blue-700 font-medium">
          ✅ Caixa conferido
        </div>
      )}

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      {/* Movimentações */}
      {movimentacoes.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <h2 className="font-semibold text-zinc-800 text-sm">Movimentações ({movimentacoes.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {movimentacoes.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-zinc-800">{m.descricao}</div>
                  <div className="text-xs text-zinc-400">{CAT_LABEL[m.categoria] ?? m.categoria} • {new Date(m.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <span className={`font-bold text-sm ${m.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                  {m.tipo === "entrada" ? "+" : "-"}{fmt(m.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
