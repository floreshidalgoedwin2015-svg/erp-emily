"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DadosCobranca = {
  cliente_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento?: string | null;
  observacoes?: string | null;
};

export type ResultadoCobranca =
  | { sucesso: true; id: number }
  | { sucesso: false; erro: string };

export async function criarCobranca(dados: DadosCobranca): Promise<ResultadoCobranca> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!dados.cliente_nome?.trim()) return { sucesso: false, erro: "Informe o nome do cliente." };
  if (!dados.descricao?.trim()) return { sucesso: false, erro: "Informe a descrição da cobrança." };
  if (!dados.valor || dados.valor <= 0) return { sucesso: false, erro: "Informe um valor válido." };
  if (!dados.data_vencimento) return { sucesso: false, erro: "Informe a data de vencimento." };

  const { data: cobranca, error } = await supabase
    .from("cobrancas")
    .insert({
      cliente_nome: dados.cliente_nome.trim(),
      descricao: dados.descricao.trim(),
      valor: dados.valor,
      data_vencimento: dados.data_vencimento,
      forma_pagamento: dados.forma_pagamento ?? null,
      observacoes: dados.observacoes?.trim() || null,
      status: "pendente",
      usuario_id: user.id,
    })
    .select()
    .single();

  if (error || !cobranca) return { sucesso: false, erro: error?.message ?? "Erro ao criar cobrança." };

  revalidatePath("/cobrancas");
  redirect("/cobrancas");
}

export async function marcarComoPago(
  cobrancaId: number,
  dataPagamento: string,
): Promise<ResultadoCobranca> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("cobrancas")
    .update({
      status: "pago",
      data_pagamento: dataPagamento || new Date().toISOString().split("T")[0],
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", cobrancaId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/cobrancas");
  return { sucesso: true, id: cobrancaId };
}
