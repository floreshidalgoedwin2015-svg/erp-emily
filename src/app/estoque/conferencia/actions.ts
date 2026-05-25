"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type AjusteConferencia = {
  variacao_id: number;
  estoque_anterior: number;
  estoque_novo: number;
};

export type ResultadoConferencia = { sucesso: boolean; ajustados: number; erro?: string };

export async function salvarConferencia(
  ajustes: AjusteConferencia[],
): Promise<ResultadoConferencia> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, ajustados: 0, erro: "Não autorizado." };

  const alterados = ajustes.filter((a) => a.estoque_novo !== a.estoque_anterior);
  if (alterados.length === 0) return { sucesso: true, ajustados: 0 };

  for (const ajuste of alterados) {
    await supabase
      .from("variacoes")
      .update({ estoque_atual: ajuste.estoque_novo, atualizado_em: new Date().toISOString() })
      .eq("id", ajuste.variacao_id);

    await supabase.from("movimentacoes_estoque").insert({
      variacao_id: ajuste.variacao_id,
      tipo: "ajuste",
      quantidade: Math.abs(ajuste.estoque_novo - ajuste.estoque_anterior),
      estoque_antes: ajuste.estoque_anterior,
      estoque_depois: ajuste.estoque_novo,
      motivo: "Conferência de estoque",
      usuario_id: user.id,
    });
  }

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  revalidatePath("/dashboard");

  return { sucesso: true, ajustados: alterados.length };
}
