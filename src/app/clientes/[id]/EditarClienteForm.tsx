"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarCliente } from "./actions";

type ClienteDb = {
  id: number;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  cpf: string | null;
  observacoes: string | null;
};

type VendaHistorico = {
  id: number;
  numero_venda: number;
  total: number;
  forma_pagamento: string;
  criado_em: string;
};

const FORMAS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  misto: "Misto",
};

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

function wppLink(wpp: string) {
  const digits = wpp.replace(/\D/g, "");
  const num = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${num}`;
}

const inp =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

export function EditarClienteForm({
  cliente,
  historico,
}: {
  cliente: ClienteDb;
  historico: VendaHistorico[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState(cliente.nome);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [cpf, setCpf] = useState(cliente.cpf ?? "");
  const [observacoes, setObservacoes] = useState(cliente.observacoes ?? "");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  function handleSalvar() {
    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }
    setErro("");
    startTransition(async () => {
      const resultado = await atualizarCliente(cliente.id, {
        nome: nome.trim(),
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        cpf: cpf.trim() || null,
        observacoes: observacoes.trim() || null,
      });
      if (resultado.sucesso) {
        setSucesso(true);
        setTimeout(() => router.push("/clientes"), 1200);
      } else {
        setErro(resultado.erro ?? "Erro ao salvar.");
      }
    });
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-12 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-zinc-800">
          Cliente salvo com sucesso!
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Redirecionando para a lista...
        </p>
      </div>
    );
  }

  const totalGasto = historico.reduce((s, v) => s + v.total, 0);

  return (
    <div className="space-y-6">
      {/* ── Dados ── */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-5">
          👤 Dados do cliente
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>WhatsApp</label>
            <div className="flex gap-2">
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(85) 99999-9999"
                className={inp}
              />
              {whatsapp && (
                <a
                  href={wppLink(whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 flex items-center px-3 rounded-xl border border-emerald-200 text-emerald-700 text-lg hover:bg-emerald-50 transition"
                  title="Abrir no WhatsApp"
                >
                  💬
                </a>
              )}
            </div>
          </div>

          <div>
            <label className={lbl}>E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="maria@email.com"
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>CPF</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className={inp}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={lbl}>Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Tamanho preferido, preferências, endereço para entrega..."
              className={inp + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* ── Erro ── */}
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {erro}
        </div>
      )}

      {/* ── Botões ── */}
      <div className="flex gap-3 justify-end">
        <a
          href="/clientes"
          className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
        >
          Cancelar
        </a>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "💾 Salvar alterações"}
        </button>
      </div>

      {/* ── Histórico de compras ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">
            🧾 Histórico de compras
          </h2>
          {historico.length > 0 && (
            <span className="text-xs text-zinc-500">
              {historico.length} venda{historico.length !== 1 ? "s" : ""} •{" "}
              <span className="font-semibold text-amber-700">
                {fmt(totalGasto)}
              </span>{" "}
              no total
            </span>
          )}
        </div>

        {historico.length === 0 ? (
          <div className="p-10 text-center text-zinc-400 text-sm">
            Nenhuma compra registrada com o nome deste cliente.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Venda
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Pagamento
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Data
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {historico.map((v) => (
                <tr key={v.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-amber-700">
                      #{v.numero_venda}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      {FORMAS[v.forma_pagamento] ?? v.forma_pagamento}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-zinc-500 text-xs">
                      {new Date(v.criado_em).toLocaleDateString("pt-BR")}{" "}
                      {new Date(v.criado_em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">
                    {fmt(v.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-amber-200 bg-amber-50">
                <td
                  colSpan={3}
                  className="px-5 py-3 text-sm font-semibold text-zinc-700"
                >
                  Total gasto
                </td>
                <td className="px-5 py-3 text-right font-bold text-amber-700 text-base">
                  {fmt(totalGasto)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
