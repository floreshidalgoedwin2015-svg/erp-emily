import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from("fornecedores")
    .select("id, nome, fantasia, cnpj, cidade, uf, email, telefone, whatsapp")
    .order("nome");

  if (q?.trim()) {
    query = query.or(`nome.ilike.%${q.trim()}%,fantasia.ilike.%${q.trim()}%,cnpj.ilike.%${q.trim()}%`);
  }

  const { data: fornecedores } = await query;
  const total = fornecedores?.length ?? 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">← Início</a>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">🏭 Fornecedores</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {total} fornecedor{total !== 1 ? "es" : ""}
              {q ? ` encontrado${total !== 1 ? "s" : ""} para "${q}"` : " cadastrados"}
            </p>
          </div>
          <Link href="/fornecedores/novo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            + Novo fornecedor
          </Link>
        </div>
      </div>

      <form method="GET" className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">🔍</span>
            <input type="text" name="q" defaultValue={q ?? ""} placeholder="Pesquisar por nome ou CNPJ..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition">Buscar</button>
          {q && <a href="/fornecedores" className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-500 text-sm font-medium hover:bg-zinc-50 transition">Limpar</a>}
        </div>
      </form>

      {total === 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🏭</div>
          {q ? (
            <><h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum fornecedor encontrado</h3><a href="/fornecedores" className="text-amber-700 hover:underline text-sm">Ver todos</a></>
          ) : (
            <><h3 className="text-lg font-semibold text-zinc-800 mb-2">Nenhum fornecedor ainda</h3>
            <Link href="/fornecedores/novo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition mt-4">+ Cadastrar fornecedor</Link></>
          )}
        </div>
      )}

      {total > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">CNPJ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Cidade / UF</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Contato</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fornecedores?.map((f) => (
                <tr key={f.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-zinc-800">{f.nome}</div>
                    {f.fantasia && <div className="text-xs text-zinc-400 mt-0.5">{f.fantasia}</div>}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell"><span className="text-zinc-500 text-xs font-mono">{f.cnpj || "—"}</span></td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-zinc-600 text-xs">{f.cidade ? `${f.cidade}${f.uf ? ` / ${f.uf}` : ""}` : "—"}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-zinc-500 text-xs">{f.whatsapp || f.telefone || f.email || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/fornecedores/${f.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 transition">
                      ✏️ Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
