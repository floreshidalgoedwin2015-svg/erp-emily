import { createClient } from "@/utils/supabase/server";
import { TransferenciaForm } from "./TransferenciaForm";

function fmt(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function TransferenciasPage() {
  const supabase = await createClient();

  const [{ data: depositos }, { data: produtos }, { data: estoqueDeposito }, { data: historico }] =
    await Promise.all([
      supabase.from("depositos").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("produtos").select("id, nome, codigo, variacoes(id, tamanho, cor)").eq("ativo", true).order("nome"),
      supabase.from("estoque_deposito").select("variacao_id, deposito_id, quantidade"),
      supabase
        .from("transferencias_estoque")
        .select(`id, quantidade, observacao, criado_em,
          variacoes ( tamanho, cor, produtos ( nome ) ),
          origem:depositos!deposito_origem_id ( nome ),
          destino:depositos!deposito_destino_id ( nome )`)
        .order("criado_em", { ascending: false })
        .limit(50),
    ]);

  // Monta mapa rápido "variacaoId_depositoId" => quantidade
  const estoqueMap: Record<string, number> = {};
  for (const e of estoqueDeposito ?? []) {
    estoqueMap[`${e.variacao_id}_${e.deposito_id}`] = e.quantidade;
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <a href="/estoque" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Estoque
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">🔄 Transferência de estoque</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Mova peças entre depósitos — Geral, Canindé, Porto, Site...
        </p>
      </div>

      {/* Formulário */}
      <TransferenciaForm
        produtos={(produtos ?? []) as any}
        depositos={depositos ?? []}
        estoqueMap={estoqueMap}
      />

      {/* Histórico */}
      <h2 className="text-lg font-bold text-zinc-800 mb-4">📋 Histórico de transferências</h2>

      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        {!historico || historico.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="text-zinc-500 text-sm">Nenhuma transferência ainda.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1.5fr_1.5fr_2fr_1fr_1fr] gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100">
              <span className="text-xs font-semibold text-zinc-500 uppercase">De</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase">Para</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase">Produto</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase text-center">Qtd</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase">Data</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {historico.map((t: any) => {
                const variacao = t.variacoes as { tamanho: string | null; cor: string | null; produtos: { nome: string } | null } | null;
                const varLabel = [variacao?.tamanho, variacao?.cor].filter(Boolean).join(" / ");
                return (
                  <div key={t.id} className="grid grid-cols-2 sm:grid-cols-[1.5fr_1.5fr_2fr_1fr_1fr] gap-2 items-center px-5 py-3">
                    <div className="text-sm font-medium text-zinc-700">
                      📦 {t.origem?.nome ?? "—"}
                    </div>
                    <div className="text-sm font-medium text-amber-700">
                      🏪 {t.destino?.nome ?? "—"}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-sm text-zinc-800">{variacao?.produtos?.nome ?? "—"}</div>
                      {varLabel && <div className="text-xs text-zinc-400">{varLabel}</div>}
                      {t.observacao && <div className="text-xs text-zinc-400 italic">{t.observacao}</div>}
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                        {t.quantidade}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">{fmt(t.criado_em)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
