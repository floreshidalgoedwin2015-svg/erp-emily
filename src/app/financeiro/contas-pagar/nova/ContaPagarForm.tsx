"use client";

import { useState, useTransition } from "react";
import { criarContaPagar } from "./actions";

const CATEGORIAS = [
  { value: "aluguel", label: "🏠 Aluguel" },
  { value: "fornecedor", label: "🏭 Fornecedor" },
  { value: "utilidade", label: "💡 Água/Luz/Internet" },
  { value: "salario", label: "👤 Salário" },
  { value: "imposto", label: "📋 Imposto/Taxa" },
  { value: "marketing", label: "📣 Marketing" },
  { value: "outros", label: "📦 Outros" },
];

const inp = "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

type Fornecedor = { id: number; nome: string };

export function ContaPagarForm({ fornecedores }: { fornecedores: Fornecedor[] }) {
  const [isPending, startTransition] = useTransition();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [categoria, setCategoria] = useState("outros");
  const [fornecedorId, setFornecedorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  function handleSalvar() {
    if (!descricao.trim()) { setErro("Informe a descrição."); return; }
    if (!valor || parseFloat(valor) <= 0) { setErro("Informe um valor válido."); return; }
    if (!dataVencimento) { setErro("Informe a data de vencimento."); return; }
    setErro("");
    startTransition(async () => {
      const r = await criarContaPagar({
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        data_vencimento: dataVencimento,
        categoria,
        fornecedor_id: fornecedorId ? parseInt(fornecedorId) : null,
        observacoes: observacoes.trim() || null,
      });
      if (r && !r.sucesso) setErro(r.erro ?? "Erro ao salvar.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados da conta</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Descrição <span className="text-red-500">*</span></label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Aluguel loja maio, Nota fiscal Fornecedora X..." className={inp} />
          </div>
          <div>
            <label className={lbl}>Valor (R$) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={inp} />
          </div>
          <div>
            <label className={lbl}>Data de vencimento <span className="text-red-500">*</span></label>
            <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inp}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Fornecedor (opcional)</label>
            <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} className={inp}>
              <option value="">Nenhum</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Nota fiscal, referência..." className={inp + " resize-none"} />
          </div>
        </div>
      </div>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      <div className="flex gap-3 justify-end pb-8">
        <a href="/financeiro/contas-pagar" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Salvar conta"}
        </button>
      </div>
    </div>
  );
}
