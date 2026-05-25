import { createClient } from "@/utils/supabase/server";
import { ConferenciaForm } from "./ConferenciaForm";

export default async function ConferenciaEstoquePage() {
  const supabase = await createClient();

  const { data: produtos } = await supabase
    .from("produtos")
    .select(`
      id, nome,
      categorias ( nome ),
      variacoes ( id, tamanho, cor, estoque_atual )
    `)
    .eq("ativo", true)
    .order("nome");

  // Achata em lista de variações com dados do produto
  const variacoes = (produtos ?? []).flatMap((p) =>
    (p.variacoes as unknown as { id: number; tamanho: string | null; cor: string | null; estoque_atual: number }[]).map((v) => ({
      id: v.id,
      tamanho: v.tamanho,
      cor: v.cor,
      estoque_atual: v.estoque_atual,
      produto_id: p.id,
      produto_nome: p.nome,
      categoria_nome: (p.categorias as unknown as { nome: string } | null)?.nome ?? null,
    }))
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <a href="/estoque" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Estoque
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">📋 Conferência de estoque</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Compare o estoque do sistema com o físico. Altere a coluna <strong>Conferido</strong> e salve.
        </p>
      </div>

      <ConferenciaForm variacoes={variacoes} />
    </div>
  );
}
