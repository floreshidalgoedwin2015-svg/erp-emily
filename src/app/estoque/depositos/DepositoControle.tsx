"use client";

import { useState, useTransition } from "react";
import { criarDeposito, editarDeposito, toggleDepositoAtivo } from "./actions";

type Deposito = {
  id: number;
  nome: string;
  descricao: string | null;
  padrao: boolean;
  ativo: boolean;
};

/* ── Modal de criar / editar ─────────────────────────────── */
function DepositoModal({
  deposito,
  onFechar,
}: {
  deposito?: Deposito;
  onFechar: () => void;
}) {
  const editando = !!deposito;
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState(deposito?.nome ?? "");
  const [descricao, setDescricao] = useState(deposito?.descricao ?? "");
  const [padrao, setPadrao] = useState(deposito?.padrao ?? false);
  const [erro, setErro] = useState("");

  function handleSalvar() {
    if (!nome.trim()) { setErro("Informe o nome."); return; }
    setErro("");
    startTransition(async () => {
      const r = editando
        ? await editarDeposito(deposito!.id, nome, descricao, padrao)
        : await criarDeposito(nome, descricao, padrao);
      if (r.sucesso) onFechar();
      else setErro(r.erro ?? "Erro ao salvar.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-800">
            {editando ? "✏️ Editar depósito" : "🏪 Novo depósito"}
          </h2>
          <button type="button" onClick={onFechar} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Nome *</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Shopping Canindé, Casa..."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Descrição</label>
            <input
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Opcional — ex: Box 189, andar 2..."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={padrao}
              onChange={e => setPadrao(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
            <span className="text-sm text-zinc-700">Depósito padrão</span>
          </label>
          {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
              Cancelar
            </button>
            <button type="button" onClick={handleSalvar} disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
              {isPending ? "Salvando..." : editando ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Botão Incluir depósito ───────────────────────────────── */
export function IncluirDepositoBtn() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
      >
        + Incluir depósito
      </button>
      {aberto && <DepositoModal onFechar={() => setAberto(false)} />}
    </>
  );
}

/* ── Linha de depósito com Editar / Ativar-Desativar ─────── */
export function DepositoLinha({ deposito }: { deposito: Deposito }) {
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleDepositoAtivo(deposito.id, !deposito.ativo);
    });
  }

  return (
    <>
      <div className={`flex items-center justify-between px-5 py-4 ${!deposito.ativo ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">🏪</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-800 text-sm">{deposito.nome}</span>
              {deposito.padrao && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                  Padrão
                </span>
              )}
              {!deposito.ativo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 uppercase tracking-wide">
                  Inativo
                </span>
              )}
            </div>
            {deposito.descricao && (
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{deposito.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:border-amber-300 hover:text-amber-700 transition"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-50 ${
              deposito.ativo
                ? "border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-600"
                : "border-emerald-200 text-emerald-600 hover:border-emerald-400"
            }`}
          >
            {deposito.ativo ? "Desativar" : "Ativar"}
          </button>
        </div>
      </div>
      {editando && (
        <DepositoModal deposito={deposito} onFechar={() => setEditando(false)} />
      )}
    </>
  );
}
