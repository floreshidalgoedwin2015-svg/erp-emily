"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type EntradaDados = {
  variacao_id: number;
  quantidade: number;
  motivo: string;
};

export type ResultadoEntrada = {
  sucesso: boolean;
  erro?: string;
  estoque_novo?: number;
};

export async function registrarEntrada(
  dados: EntradaDados
): Promise<ResultadoEntrada> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  if (!dados.variacao_id || dados.quantidade <= 0) {
    return { sucesso: false, erro: "Dados inválidos." };
  }

  // Busca estoque atual
  const { data: variacao } = await supabase
    .from("variacoes")
    .select("id, estoque_atual")
    .eq("id", dados.variacao_id)
    .single();

  if (!variacao) return { sucesso: false, erro: "Variação não encontrada." };

  const estoqueAntes = variacao.estoque_atual ?? 0;
  const estoqueDepois = estoqueAntes + dados.quantidade;

  // Atualiza estoque
  const { error: erroUpdate } = await supabase
    .from("variacoes")
    .update({
      estoque_atual: estoqueDepois,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", dados.variacao_id);

  if (erroUpdate) return { sucesso: false, erro: erroUpdate.message };

  // Registra movimentação
  await supabase.from("movimentacoes_estoque").insert({
    variacao_id: dados.variacao_id,
    tipo: "entrada",
    quantidade: dados.quantidade,
    estoque_antes: estoqueAntes,
    estoque_depois: estoqueDepois,
    motivo: dados.motivo || "Entrada de mercadoria",
    usuario_id: user.id,
  });

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  revalidatePath("/produtos");

  return { sucesso: true, estoque_novo: estoqueDepois };
}
