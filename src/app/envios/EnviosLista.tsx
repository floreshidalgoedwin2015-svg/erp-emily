"use client";

import { useState, useTransition } from "react";
import { salvarEnvio, atualizarRastreamento } from "./actions";

type PedidoEnvio = {
  id: number;
  cliente_nome: string;
  total: number;
  status: string;
  endereco_entrega: string | null;
  codigo_rastreamento: string | null;
  servico_envio: string | null;
  criado_em: string;
};

const SERVICOS = [
  { value: "pac", label: "PAC" },
  { value: "sedex", label: "SEDEX" },
  { value: "sedex10", label: "SEDEX 10" },
  { value: "pac_mini", label: "PAC Mini Envios" },
  { value: "sedex_mini", label: "SEDEX Mini Envios" },
  { value: "carta_reg", label: "Carta Registrada" },
  { value: "motoboy", label: "Motoboy" },
  { value: "retirada", label: "Retirada na loja" },
];

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

const STATUS_BADGE: Record<string, string> = {
  confirmado: "bg-blue-100 text-blue-700",
  separando: "bg-amber-100 text-amber-700",
  enviado: "bg-purple-100 text-purple-700",
  entregue: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado", separando: "Separando", enviado: "Enviado", entregue: "Entregue",
};

export function EnviosLista({ pedidos }: { pedidos: PedidoEnvio[] }) {
  const [isPending, startTransition] = useTransition();
  const [expandido, setExpandido] = useState<number | null>(null);
  const [codigoEdit, setCodigoEdit] = useState<Record<number, string>>({});
  const [servicoEdit, setServicoEdit] = useState<Record<number, string>>({});
  const [erros, setErros] = useState<Record<number, string>>({});
  const [sucesso, setSucesso] = useState<Record<number, boolean>>({});

  function abrirExpansao(p: PedidoEnvio) {
    setExpandido(expandido === p.id ? null : p.id);
    if (!codigoEdit[p.id]) setCodigoEdit(prev => ({ ...prev, [p.id]: p.codigo_rastreamento ?? "" }));
    if (!servicoEdit[p.id]) setServicoEdit(prev => ({ ...prev, [p.id]: p.servico_envio ?? "pac" }));
  }

  function handleEnviar(p: PedidoEnvio) {
    setErros(prev => ({ ...prev, [p.id]: "" }));
    startTransition(async () => {
      const r = await salvarEnvio(p.id, codigoEdit[p.id] ?? "", servicoEdit[p.id] ?? "pac");
      if (r.sucesso) { setSucesso(prev => ({ ...prev, [p.id]: true })); setExpandido(null); }
      else setErros(prev => ({ ...prev, [p.id]: r.erro ?? "Erro." }));
    });
  }

  function handleAtualizarCodigo(pedidoId: number) {
    startTransition(async () => {
      const r = await atualizarRastreamento(pedidoId, codigoEdit[pedidoId] ?? "");
      if (r.sucesso) { setSucesso(prev => ({ ...prev, [pedidoId]: true })); setExpandido(null); }
      else setErros(prev => ({ ...prev, [pedidoId]: r.erro ?? "Erro." }));
    });
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
        <div className="text-5xl mb-3">📮</div>
        <p className="text-zinc-500 text-sm">Nenhum pedido para despachar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map(p => {
        const aberto = expandido === p.id;
        const jaEnviado = p.status === "enviado" || p.status === "entregue";
        const urlRastrear = p.codigo_rastreamento
          ? `https://rastreamento.correios.com.br/app/index.php?objeto=${p.codigo_rastreamento}`
          : null;

        return (
          <div key={p.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${sucesso[p.id] ? "border-emerald-200" : "border-amber-100"}`}>
            {/* Linha principal */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-amber-700">#{p.id}</span>
                  <span className="font-semibold text-zinc-800 truncate">{p.cliente_nome}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                {p.endereco_entrega && (
                  <div className="text-xs text-zinc-400 mt-0.5 truncate">📍 {p.endereco_entrega}</div>
                )}
                {p.codigo_rastreamento && (
                  <div className="text-xs text-zinc-500 mt-0.5 font-mono">
                    📦 {p.codigo_rastreamento}
                    {p.servico_envio && <span className="ml-2 text-zinc-400">{SERVICOS.find(s => s.value === p.servico_envio)?.label ?? p.servico_envio}</span>}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-zinc-800">{fmt(p.total)}</div>
                <div className="text-xs text-zinc-400">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</div>
              </div>
              {/* Ações */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                {urlRastrear && (
                  <a href={urlRastrear} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition">
                    🔍 Rastrear
                  </a>
                )}
                <a href={`/envios/${p.id}`} target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 transition">
                  🖨️ Etiqueta
                </a>
                <button type="button" onClick={() => abrirExpansao(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${aberto ? "bg-zinc-100 text-zinc-600" : "border border-amber-200 text-amber-700 hover:bg-amber-50"}`}>
                  {aberto ? "✕ Fechar" : jaEnviado ? "✏️ Editar envio" : "📮 Despachar"}
                </button>
              </div>
            </div>

            {/* Expansão */}
            {aberto && (
              <div className="px-5 pb-5 pt-2 border-t border-amber-50 bg-amber-50/30">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Serviço de envio</label>
                    <select value={servicoEdit[p.id] ?? "pac"} onChange={e => setServicoEdit(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                      {SERVICOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Código de rastreamento</label>
                    <input
                      value={codigoEdit[p.id] ?? ""}
                      onChange={e => setCodigoEdit(prev => ({ ...prev, [p.id]: e.target.value.toUpperCase() }))}
                      placeholder="Ex: AA123456789BR"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 uppercase placeholder:normal-case"
                    />
                  </div>
                  <div className="flex gap-2">
                    {!jaEnviado ? (
                      <button type="button" onClick={() => handleEnviar(p)} disabled={isPending}
                        className="flex-1 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60">
                        {isPending ? "Salvando..." : "✅ Marcar enviado"}
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleAtualizarCodigo(p.id)} disabled={isPending}
                        className="flex-1 px-4 py-2 rounded-xl bg-zinc-700 text-white text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-60">
                        {isPending ? "Salvando..." : "💾 Salvar código"}
                      </button>
                    )}
                  </div>
                </div>
                {erros[p.id] && <p className="mt-2 text-sm text-red-600">⚠️ {erros[p.id]}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
