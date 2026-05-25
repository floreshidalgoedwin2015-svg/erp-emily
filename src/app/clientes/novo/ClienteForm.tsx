"use client";

import { useActionState } from "react";
import { criarCliente } from "./actions";

export function ClienteForm() {
  const [state, action, pending] = useActionState(criarCliente, undefined);

  const inp =
    "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <form action={action} className="space-y-6">
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-5">
          👤 Dados do cliente
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nome */}
          <div className="sm:col-span-2">
            <label className={lbl}>
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="nome"
              required
              placeholder="Ex: Maria Silva"
              className={inp}
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className={lbl}>WhatsApp</label>
            <input
              name="whatsapp"
              placeholder="(85) 99999-9999"
              className={inp}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className={lbl}>E-mail</label>
            <input
              name="email"
              type="email"
              placeholder="maria@email.com"
              className={inp}
            />
          </div>

          {/* CPF */}
          <div>
            <label className={lbl}>CPF</label>
            <input
              name="cpf"
              placeholder="000.000.000-00"
              className={inp}
            />
          </div>

          {/* Observações */}
          <div className="sm:col-span-2">
            <label className={lbl}>Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Tamanho preferido, preferências, endereço para entrega..."
              className={inp + " resize-none"}
            />
          </div>
        </div>
      </div>

      {state?.erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {state.erro}
        </div>
      )}

      <div className="flex gap-3 justify-end pb-8">
        <a
          href="/clientes"
          className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60"
        >
          {pending ? "Salvando..." : "💾 Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
