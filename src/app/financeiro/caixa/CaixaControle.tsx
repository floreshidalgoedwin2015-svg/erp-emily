"use client";

import { useState, useTransition } from "react";
import { abrirCaixa } from "./actions";

const LOJAS = [
  "Shopping Porto - Box 505",
  "Shopping Canindé - Box 189",
  "Loja Online",
  "Outro",
];

export function AbrirCaixaModal({ onFechar }: { onFechar: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [loja, setLoja] = useState(LOJAS[0]);
  const [lojaCustom, setLojaCustom] = useState("");
  const [saldo, setSaldo] = useState("0");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");

  const lojaFinal = loja === "Outro" ? lojaCustom : loja;

  function handleAbrir() {
    if (!lojaFinal.trim()) { setErro("Informe a loja."); return; }
    setErro("");
    startTransition(async () => {
      const r = await abrirCaixa(lojaFinal, parseFloat(saldo) || 0, obs);
      if (r && !r.sucesso) setErro(r.erro ?? "Erro ao abrir.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-800">🔓 Abrir caixa</h2>
          <button type="button" onClick={onFechar} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Loja / Local</label>
            <select value={loja} onChange={e => setLoja(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
              {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {loja === "Outro" && (
              <input value={lojaCustom} onChange={e => setLojaCustom(e.target.value)}
                placeholder="Nome da loja..." className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Saldo de abertura (R$)</label>
            <input type="number" min="0" step="0.01" value={saldo} onChange={e => setSaldo(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Observações</label>
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional..."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</button>
            <button type="button" onClick={handleAbrir} disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
              {isPending ? "Abrindo..." : "🔓 Abrir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
