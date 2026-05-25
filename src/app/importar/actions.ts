"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type VariacaoBling = {
  codigo: string;
  cor: string | null;
  tamanho: string | null;
  preco_venda: number;
  preco_custo: number;
  estoque: number;
  codigo_barras: string | null;
};

export type ProdutoBling = {
  nome: string;
  codigo: string;
  preco_venda: number;
  preco_custo: number;
  estoque: number;
  categoria: string;
  codigo_barras: string;
  situacao: string;
  variacoes?: VariacaoBling[];
};

export type ResultadoImportacao = {
  importados: number;
  ignorados: number;
  erros: string[];
  erro?: string;
};

export async function importarProdutosBling(
  produtos: ProdutoBling[],
): Promise<ResultadoImportacao> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { importados: 0, ignorados: 0, erros: [], erro: "Não autorizado." };

  if (!produtos || produtos.length === 0) {
    return { importados: 0, ignorados: 0, erros: [], erro: "Nenhum produto para importar." };
  }

  let importados = 0;
  let ignorados = 0;
  const erros: string[] = [];

  // Busca ou cria categorias de uma vez
  const categoriasUnicas = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
  const mapaCategoria: Record<string, number> = {};

  for (const nomeCategoria of categoriasUnicas) {
    const { data: catExistente } = await supabase
      .from("categorias")
      .select("id")
      .ilike("nome", nomeCategoria)
      .single();

    if (catExistente) {
      mapaCategoria[nomeCategoria] = catExistente.id;
    } else {
      const { data: novaCat } = await supabase
        .from("categorias")
        .insert({ nome: nomeCategoria })
        .select()
        .single();
      if (novaCat) mapaCategoria[nomeCategoria] = novaCat.id;
    }
  }

  for (const p of produtos) {
    try {
      // Verifica se já existe produto com esse código
      if (p.codigo) {
        const { data: existente } = await supabase
          .from("produtos")
          .select("id")
          .eq("codigo", p.codigo)
          .single();

        if (existente) {
          ignorados++;
          continue;
        }
      }

      // Cria o produto pai
      const { data: produto, error: erroProduto } = await supabase
        .from("produtos")
        .insert({
          nome: p.nome,
          codigo: p.codigo || null,
          categoria_id: mapaCategoria[p.categoria] ?? null,
        })
        .select()
        .single();

      if (erroProduto || !produto) {
        erros.push(`Erro em "${p.nome}": ${erroProduto?.message}`);
        continue;
      }

      // Monta lista de variações para inserir
      // Se tem variacoes explícitas (formato de variantes), cria uma por linha
      // Senão, cria uma variação única (formato simples)
      const variacoesParaCriar =
        p.variacoes && p.variacoes.length > 0
          ? p.variacoes.map((v) => ({
              produto_id: produto.id,
              tamanho: v.tamanho,
              cor: v.cor,
              codigo_barras: null as string | null,
              preco_custo: v.preco_custo || 0,
              preco_venda: v.preco_venda || 0,
              estoque_atual: v.estoque || 0,
            }))
          : [
              {
                produto_id: produto.id,
                tamanho: null as string | null,
                cor: null as string | null,
                codigo_barras: p.codigo_barras || null,
                preco_custo: p.preco_custo || 0,
                preco_venda: p.preco_venda || 0,
                estoque_atual: p.estoque || 0,
              },
            ];

      const { data: variacoesCriadas, error: erroVariacao } = await supabase
        .from("variacoes")
        .insert(variacoesParaCriar)
        .select();

      if (erroVariacao || !variacoesCriadas) {
        erros.push(`Erro nas variações de "${p.nome}": ${erroVariacao?.message}`);
        continue;
      }

      // Registra movimentações de estoque iniciais (só para quem tem estoque > 0)
      const movimentacoes = variacoesCriadas
        .filter((v) => (v.estoque_atual || 0) > 0)
        .map((v) => ({
          variacao_id: v.id,
          tipo: "entrada" as const,
          quantidade: v.estoque_atual,
          estoque_antes: 0,
          estoque_depois: v.estoque_atual,
          motivo: "Importado do Bling",
          usuario_id: user.id,
        }));

      if (movimentacoes.length > 0) {
        await supabase.from("movimentacoes_estoque").insert(movimentacoes);
      }

      importados++;
    } catch {
      erros.push(`Erro inesperado em "${p.nome}"`);
    }
  }

  revalidatePath("/produtos");

  return { importados, ignorados, erros };
}
