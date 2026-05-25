"use client";

import { useState, useTransition } from "react";
import { criarCobranca } from "./actions";

const inp = "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

const FORMA_PAGAMENTO = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "a_prazo", label: "A prazo" },
];

export function CobrancaForm() {
  const [isPending, startTransition] = useTransition();
  const [clienteNome, setClienteNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  function handleSalvar() {
    if (!clienteNome.trim()) { setErro("Informe o nome do cliente."); return; }
    if (!descricao.trim()) { setErro("Informe a descrição."); return; }
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) { setErro("Informe um valor válido."); return; }
    if (!dataVencimento) { setErro("Informe a data de vencimento."); return; }
    setErro("");
    startTransition(async () => {
      const r = await criarCobranca({
        cliente_nome: clienteNome.trim(),
        descricao: descricao.trim(),
        valor: valorNum,
        data_vencimento: dataVencimento,
        forma_pagamento: formaPagamento || null,
        observacoes: observacoes.trim() || null,
      });
      if (r && !r.sucesso) setErro(r.erro);
    });
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados da cobrança</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={lbl}>Cliente <span className="text-red-500">*</span></label>
            <input
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome da cliente..."
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Forma de pagamento</label>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={inp}>
              <option value="">Selecione...</option>
              {FORMA_PAGAMENTO.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Descrição <span className="text-red-500">*</span></label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Compra de produtos, parcela do lote..."
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Valor (R$) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Data de vencimento <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className={inp}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Observações</label>
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
              className={inp}
            />
          </div>
        </div>
      </section>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      <div className="flex gap-3 justify-end pb-8">
        <a href="/cobrancas" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Criar cobrança"}
        </button>
      </div>
    </div>
  );
}
