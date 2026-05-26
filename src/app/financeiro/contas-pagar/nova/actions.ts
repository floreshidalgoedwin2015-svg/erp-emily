"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DadosContaPagar = {
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria: string;
  fornecedor_id?: number | null;
  observacoes?: string | null;
};

export type ResultadoContaPagar = { sucesso: boolean; erro?: string };

export async function criarContaPagar(dados: DadosContaPagar): Promise<ResultadoContaPagar> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!dados.descricao?.trim()) return { sucesso: false, erro: "Informe a descrição." };
  if (!dados.valor || dados.valor <= 0) return { sucesso: false, erro: "Informe um valor válido." };
  if (!dados.data_vencimento) return { sucesso: false, erro: "Informe a data de vencimento." };

  const { error } = await supabase.from("contas_pagar").insert({
    descricao: dados.descricao.trim(),
    valor: dados.valor,
    data_vencimento: dados.data_vencimento,
    categoria: dados.categoria || "outros",
    fornecedor_id: dados.fornecedor_id || null,
    observacoes: dados.observacoes?.trim() || null,
    status: "pendente",
    usuario_id: user.id,
  });

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/financeiro/contas-pagar");
  redirect("/financeiro/contas-pagar");
}

export async function marcarContaComoPaga(
  contaId: number,
  dataPagamento: string,
): Promise<ResultadoContaPagar> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("contas_pagar")
    .update({ status: "pago", data_pagamento: dataPagamento || new Date().toISOString().split("T")[0], atualizado_em: new Date().toISOString() })
    .eq("id", contaId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/financeiro/contas-pagar");
  return { sucesso: true };
}
