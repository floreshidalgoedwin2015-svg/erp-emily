"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EstadoFormProduto =
  | { erro?: string; sucesso?: boolean }
  | undefined;

export async function criarProduto(
  state: EstadoFormProduto,
  formData: FormData,
): Promise<EstadoFormProduto> {
  const supabase = await createClient();

  // Verifica se está logada
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logada para cadastrar." };

  // Dados do produto
  const nome = (formData.get("nome") as string)?.trim();
  const codigo = (formData.get("codigo") as string)?.trim() || null;
  const categoriaId = formData.get("categoria_id") as string;
  const fornecedorId = (formData.get("fornecedor_id") as string) || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  if (!nome) return { erro: "O nome do produto é obrigatório." };
  if (!categoriaId) return { erro: "Selecione uma categoria." };

  // Variações enviadas como JSON
  const variacoesJson = formData.get("variacoes") as string;
  let variacoes: Array<{
    tamanho: string;
    cor: string;
    preco_custo: number;
    preco_venda: number;
    estoque_inicial: number;
    codigo_barras: string;
  }> = [];

  try {
    variacoes = JSON.parse(variacoesJson || "[]");
  } catch {
    return { erro: "Erro ao processar as variações. Tente novamente." };
  }

  if (variacoes.length === 0) {
    return { erro: "Adicione pelo menos uma variação (tamanho/cor/preço)." };
  }

  // Valida se todas as variações têm preço de venda
  for (const v of variacoes) {
    if (!v.preco_venda || v.preco_venda <= 0) {
      return { erro: "Todas as variações precisam ter um preço de venda." };
    }
  }

  // 1. Cria o produto
  const { data: produto, error: erroProduto } = await supabase
    .from("produtos")
    .insert({
      nome,
      codigo,
      categoria_id: parseInt(categoriaId),
      fornecedor_id: fornecedorId ? parseInt(fornecedorId) : null,
      descricao,
    })
    .select()
    .single();

  if (erroProduto || !produto) {
    console.error(erroProduto);
    return { erro: "Erro ao salvar o produto. Tente novamente." };
  }

  // 2. Cria as variações e registra estoque inicial
  for (const v of variacoes) {
    const { data: variacao, error: erroVariacao } = await supabase
      .from("variacoes")
      .insert({
        produto_id: produto.id,
        tamanho: v.tamanho || null,
        cor: v.cor || null,
        codigo_barras: v.codigo_barras || null,
        preco_custo: v.preco_custo || 0,
        preco_venda: v.preco_venda,
        estoque_atual: v.estoque_inicial || 0,
      })
      .select()
      .single();

    if (erroVariacao || !variacao) {
      console.error(erroVariacao);
      continue; // Pula variação com erro, não cancela tudo
    }

    // 3. Registra movimentação de estoque inicial (se tiver estoque)
    if (v.estoque_inicial > 0) {
      await supabase.from("movimentacoes_estoque").insert({
        variacao_id: variacao.id,
        tipo: "entrada",
        quantidade: v.estoque_inicial,
        estoque_antes: 0,
        estoque_depois: v.estoque_inicial,
        motivo: "Estoque inicial no cadastro",
        usuario_id: user.id,
      });
    }
  }

  revalidatePath("/produtos");
  redirect("/produtos");
}
