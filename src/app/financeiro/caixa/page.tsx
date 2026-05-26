"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { AbrirCaixaModal } from "./CaixaControle";

type Sessao = {
  id: number;
  loja: string;
  operador: string | null;
  data: string;
  status: string;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  aberto_em: string;
};

const STATUS_BADGE: Record<string, string> = {
  aberto: "bg-emerald-100 text-emerald-700",
  fechado: "bg-zinc-100 text-zinc-600",
  conferido: "bg-blue-100 text-blue-700",
};
const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto", fechado: "Fechado", conferido: "Conferido",
};

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

const FILTROS = ["Todos", "Abertos", "Fechados", "Conferidos"];

export default function ControleCaixaPage() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [total, setTotal] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function carregar() {
    setLoading(true);
    let query = supabase
      .from("sessoes_caixa")
      .select("id, loja, operador, data, status, saldo_abertura, saldo_fechamento, aberto_em", { count: "exact" })
      .order("aberto_em", { ascending: false })
      .limit(50);

    if (filtro === "Abertos") query = query.eq("status", "aberto");
    else if (filtro === "Fechados") query = query.eq("status", "fechado");
    else if (filtro === "Conferidos") query = query.eq("status", "conferido");

    if (busca.trim()) query = query.ilike("loja", `%${busca}%`);

    const { data, count } = await query;
    setSessoes(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [filtro, busca]);

  return (
    <div className="p-8 max-w-5xl">
      {modalAberto && <AbrirCaixaModal onFechar={() => setModalAberto(false)} />}

      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">🏦 Controle de caixa</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{total} sessão{total !== 1 ? "ões" : ""} no total</p>
          </div>
          <button type="button" onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Abrir Caixa
          </button>
        </div>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar por loja..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
        </div>
        {FILTROS.map(f => (
          <button key={f} type="button" onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filtro === f ? "bg-amber-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-700"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100">
          {["Loja","Operador","Data","Abertura","Situação",""].map((h, i) => (
            <span key={i} className="text-xs font-semibold text-zinc-500 uppercase">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-10 text-center text-zinc-400 text-sm">Carregando...</div>
        ) : sessoes.length === 0 ? (
          <div className="p-10 text-center text-zinc-400 text-sm">
            <div className="text-4xl mb-3">🏦</div>
            Nenhum caixa encontrado. Clique em <strong>+ Abrir Caixa</strong> para começar.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sessoes.map(s => (
              <Link key={s.id} href={`/financeiro/caixa/${s.id}`}
                className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-5 py-3.5 hover:bg-amber-50/50 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-800 text-sm">{s.loja}</div>
                  <div className="sm:hidden text-xs text-zinc-400 mt-0.5">{s.operador ?? "—"} • {new Date(s.aberto_em).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="hidden sm:block text-sm text-zinc-500">{s.operador ?? "—"}</div>
                <div className="hidden sm:block text-sm text-zinc-500">
                  {new Date(s.aberto_em).toLocaleDateString("pt-BR")} {new Date(s.aberto_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="hidden sm:block text-sm text-zinc-600 font-medium">{fmt(s.saldo_abertura)}</div>
                <div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[s.status] ?? "bg-zinc-100"}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <div className="text-zinc-300 text-lg">›</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
