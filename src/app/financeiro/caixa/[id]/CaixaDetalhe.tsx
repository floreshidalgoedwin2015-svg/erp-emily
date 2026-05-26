"use client";

import { useState, useTransition } from "react";
import { salvarConferencia, conferirCaixa, fecharCaixa, adicionarMovimento } from "../actions";

const FORMAS = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "debito", label: "Cartão Débito" },
  { value: "credito", label: "Cartão Crédito" },
  { value: "a_prazo", label: "A prazo" },
  { value: "outros", label: "Outros" },
];

type Sessao = {
  id: number;
  loja: string;
  operador: string | null;
  data: string;
  status: string;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  conferencia_valores: Record<string, number> | null;
  aberto_em: string;
  fechado_em: string | null;
};

type Mov = { id: number; tipo: string; valor: number; descricao: string; categoria: string; criado_em: string };

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }
function formaLabel(v: string) { return FORMAS.find(f => f.value === v)?.label ?? v; }

export function CaixaDetalhe({
  sessao,
  vendasPorForma,
  movimentacoes,
}: {
  sessao: Sessao;
  vendasPorForma: Record<string, number>;
  movimentacoes: Mov[];
}) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Valores físicos informados pelo operador
  const [informados, setInformados] = useState<Record<string, number>>(
    sessao.conferencia_valores ?? {}
  );
  const [novaForma, setNovaForma] = useState("pix");
  const [novoValor, setNovoValor] = useState("");

  // Sangria/Suprimento
  const [mostrarSangria, setMostrarSangria] = useState(false);
  const [tipoMov, setTipoMov] = useState<"entrada" | "saida">("saida");
  const [valorMov, setValorMov] = useState("");
  const [descMov, setDescMov] = useState("");

  const STATUS_BADGE: Record<string, string> = {
    aberto: "bg-emerald-100 text-emerald-700",
    fechado: "bg-zinc-100 text-zinc-600",
    conferido: "bg-blue-100 text-blue-700",
  };
  const STATUS_LABEL: Record<string, string> = {
    aberto: "Aberto", fechado: "Fechado", conferido: "Conferido",
  };

  // Todas as formas que aparecem em registrado ou informado
  const todasFormas = Array.from(new Set([
    ...Object.keys(vendasPorForma),
    ...Object.keys(informados),
  ]));

  const totalRegistrado = Object.values(vendasPorForma).reduce((s, v) => s + v, 0);
  const totalInformado = Object.values(informados).reduce((s, v) => s + v, 0);

  function addInformado() {
    if (!novoValor || parseFloat(novoValor) <= 0) return;
    setInformados(prev => ({ ...prev, [novaForma]: parseFloat(novoValor) }));
    setNovoValor("");
    setSucesso(false);
  }

  function removeInformado(forma: string) {
    setInformados(prev => { const n = { ...prev }; delete n[forma]; return n; });
    setSucesso(false);
  }

  function handleSalvar() {
    setErro(""); setSucesso(false);
    startTransition(async () => {
      const r = await salvarConferencia(sessao.id, informados);
      if (r.sucesso) setSucesso(true);
      else setErro(r.erro ?? "Erro ao salvar.");
    });
  }

  function handleConferir() {
    setErro("");
    startTransition(async () => {
      const r = await conferirCaixa(sessao.id);
      if (!r.sucesso) setErro(r.erro ?? "Erro.");
    });
  }

  function handleFechar() {
    startTransition(async () => {
      await fecharCaixa(sessao.id, totalRegistrado);
    });
  }

  function handleAddMov() {
    if (!valorMov || parseFloat(valorMov) <= 0 || !descMov.trim()) return;
    startTransition(async () => {
      const r = await adicionarMovimento(
        sessao.id, tipoMov, parseFloat(valorMov), descMov,
        tipoMov === "saida" ? "sangria" : "suprimento"
      );
      if (r.sucesso) { setValorMov(""); setDescMov(""); setMostrarSangria(false); }
      else setErro(r.erro ?? "Erro.");
    });
  }

  const sangrias = movimentacoes.filter(m => ["sangria", "suprimento"].includes(m.categoria));

  return (
    <div className="space-y-5">

      {/* Cabeçalho da sessão */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-100 divide-y sm:divide-y-0">
          <div className="p-4">
            <div className="text-xs text-zinc-500 font-medium mb-1">Loja</div>
            <div className="text-sm font-bold text-zinc-800">{sessao.loja}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-zinc-500 font-medium mb-1">Operador</div>
            <div className="text-sm font-semibold text-zinc-700">{sessao.operador ?? "—"}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-zinc-500 font-medium mb-1">Abertura</div>
            <div className="text-sm text-zinc-700">
              {new Date(sessao.aberto_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-zinc-500 font-medium mb-1">Situação</div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[sessao.status] ?? "bg-zinc-100"}`}>
              {STATUS_LABEL[sessao.status] ?? sessao.status}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Informar valores | Totais do sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Esquerda: o que você contou fisicamente */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <h2 className="font-semibold text-zinc-800 mb-1">💵 O que você contou</h2>
          <p className="text-xs text-zinc-400 mb-4">Informe o valor físico de cada forma de pagamento</p>

          <div className="flex gap-2 mb-3">
            <select value={novaForma} onChange={e => setNovaForma(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
              {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <input type="number" min="0" step="0.01" value={novoValor}
              onChange={e => setNovoValor(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addInformado()}
              placeholder="0,00"
              className="w-28 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <button type="button" onClick={addInformado}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition">
              +
            </button>
          </div>

          {Object.keys(informados).length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-5 border-2 border-dashed border-zinc-100 rounded-xl">
              Informe os valores que você contou
            </p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(informados).map(([forma, valor]) => (
                <div key={forma} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm font-medium text-zinc-700">{formaLabel(forma)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-zinc-800">{fmt(valor)}</span>
                    <button type="button" onClick={() => removeInformado(forma)}
                      className="text-zinc-300 hover:text-red-400 transition text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Total informado</span>
            <span className="font-bold text-amber-700 text-base">{fmt(totalInformado)}</span>
          </div>
        </div>

        {/* Direita: o que o sistema registrou */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <h2 className="font-semibold text-zinc-800 mb-1">📊 O que o sistema registrou</h2>
          <p className="text-xs text-zinc-400 mb-4">Vendas do dia por forma de pagamento</p>

          {Object.keys(vendasPorForma).length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-5 border-2 border-dashed border-zinc-100 rounded-xl">
              Nenhuma venda registrada neste dia
            </p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(vendasPorForma).map(([forma, valor]) => (
                <div key={forma} className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm font-medium text-zinc-700">{formaLabel(forma)}</span>
                  <span className="font-bold text-sm text-emerald-700">{fmt(valor)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Total registrado</span>
            <span className="font-bold text-emerald-700 text-base">{fmt(totalRegistrado)}</span>
          </div>
        </div>
      </div>

      {/* Tabela de conferência */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <h2 className="font-semibold text-zinc-800">📋 Formas de pagamento</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Forma</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Total registrado</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Total informado</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Diferença</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {todasFormas.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-400">Nenhum dado para conferir</td></tr>
            ) : todasFormas.map(forma => {
              const reg = vendasPorForma[forma] ?? 0;
              const inf = informados[forma] ?? 0;
              const diff = reg - inf;
              return (
                <tr key={forma} className="hover:bg-amber-50/40">
                  <td className="px-5 py-3 font-medium text-zinc-800">{formaLabel(forma)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(reg)}</td>
                  <td className="px-5 py-3 text-right text-zinc-600">
                    {inf > 0 ? <span className="font-semibold">{fmt(inf)}</span> : <span className="text-zinc-300">R$ —</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold">
                    {inf === 0
                      ? <span className="text-zinc-300">—</span>
                      : diff === 0
                        ? <span className="text-emerald-600">✅ Bateu</span>
                        : diff > 0
                          ? <span className="text-red-500">-{fmt(diff)}</span>
                          : <span className="text-amber-600">+{fmt(Math.abs(diff))}</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-amber-200 bg-amber-50">
              <td className="px-5 py-3 font-bold text-zinc-800">Total</td>
              <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmt(totalRegistrado)}</td>
              <td className="px-5 py-3 text-right font-bold text-zinc-700">{fmt(totalInformado)}</td>
              <td className="px-5 py-3 text-right font-bold">
                {totalInformado === 0
                  ? <span className="text-zinc-300">—</span>
                  : totalRegistrado === totalInformado
                    ? <span className="text-emerald-600">✅ Bateu!</span>
                    : <span className="text-red-600">
                        {fmt(Math.abs(totalRegistrado - totalInformado))}
                        {totalRegistrado > totalInformado ? " a menos" : " a mais"}
                      </span>
                }
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sangrias / Suprimentos */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">🔻 Sangrias / Suprimentos</h2>
          {sessao.status === "aberto" && (
            <button type="button" onClick={() => setMostrarSangria(!mostrarSangria)}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-100 transition font-semibold">
              + Adicionar
            </button>
          )}
        </div>
        {mostrarSangria && (
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
            <div className="flex gap-2 flex-wrap items-end">
              <button type="button" onClick={() => setTipoMov("saida")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${tipoMov === "saida" ? "bg-red-500 text-white" : "bg-zinc-200 text-zinc-600"}`}>
                🔻 Sangria
              </button>
              <button type="button" onClick={() => setTipoMov("entrada")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${tipoMov === "entrada" ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"}`}>
                ➕ Suprimento
              </button>
              <input type="number" min="0" step="0.01" value={valorMov} onChange={e => setValorMov(e.target.value)} placeholder="Valor R$"
                className="w-28 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              <input value={descMov} onChange={e => setDescMov(e.target.value)} placeholder="Observação..."
                className="flex-1 min-w-40 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              <button type="button" onClick={handleAddMov} disabled={isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition">
                Salvar
              </button>
            </div>
          </div>
        )}
        {sangrias.length === 0 ? (
          <div className="px-5 py-6 text-center text-zinc-400 text-sm">Nenhuma sangria ou suprimento nesta sessão.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Data</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Observação</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Tipo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sangrias.map(m => (
                <tr key={m.id}>
                  <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(m.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">{m.descricao}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.tipo === "saida" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                      {m.categoria === "sangria" ? "🔻 Sangria" : "➕ Suprimento"}
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-right font-bold ${m.tipo === "saida" ? "text-red-500" : "text-emerald-600"}`}>
                    {m.tipo === "saida" ? "-" : "+"}{fmt(m.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sucesso && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          ✅ Conferência salva com sucesso!
        </div>
      )}
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>
      )}

      {/* Botões */}
      <div className="flex flex-wrap gap-3 justify-between pb-8">
        <div className="flex gap-2">
          {sessao.status === "aberto" && (
            <button type="button" onClick={handleFechar} disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60">
              🔒 Fechar caixa
            </button>
          )}
          {sessao.status === "fechado" && (
            <button type="button" onClick={handleConferir} disabled={isPending}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {isPending ? "..." : "✅ Marcar como conferido"}
            </button>
          )}
        </div>
        <button type="button" onClick={handleSalvar} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Salvar conferência"}
        </button>
      </div>
    </div>
  );
}
