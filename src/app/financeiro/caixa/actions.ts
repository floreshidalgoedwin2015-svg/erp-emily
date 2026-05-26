"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ResultadoCaixa = { sucesso: boolean; erro?: string; id?: number };

export async function abrirCaixa(
  loja: string,
  saldoAbertura: number,
  observacoes?: string,
): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!loja.trim()) return { sucesso: false, erro: "Selecione a loja." };

  const { data: perfil } = await supabase
    .from("atendentes")
    .select("nome")
    .eq("user_id", user.id)
    .maybeSingle();

  const operador = perfil?.nome ?? user.email ?? "Desconhecido";

  const { data, error } = await supabase
    .from("sessoes_caixa")
    .insert({
      loja: loja.trim(),
      operador,
      data: new Date().toISOString().split("T")[0],
      saldo_abertura: saldoAbertura,
      observacoes: observacoes?.trim() || null,
      status: "aberto",
      usuario_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { sucesso: false, erro: error?.message ?? "Erro ao abrir caixa." };
  revalidatePath("/financeiro/caixa");
  redirect(`/financeiro/caixa/${data.id}`);
}

export async function fecharCaixa(
  sessaoId: number,
  saldoFechamento: number,
  observacoes?: string,
): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("sessoes_caixa")
    .update({
      status: "fechado",
      saldo_fechamento: saldoFechamento,
      observacoes: observacoes?.trim() || null,
      fechado_em: new Date().toISOString(),
    })
    .eq("id", sessaoId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/financeiro/caixa");
  revalidatePath(`/financeiro/caixa/${sessaoId}`);
  return { sucesso: true };
}

export async function conferirCaixa(sessaoId: number): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("sessoes_caixa")
    .update({ status: "conferido" })
    .eq("id", sessaoId)
    .eq("status", "fechado");

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/financeiro/caixa");
  revalidatePath(`/financeiro/caixa/${sessaoId}`);
  return { sucesso: true };
}

export async function salvarConferencia(
  sessaoId: number,
  valores: Record<string, number>,
): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("sessoes_caixa")
    .update({ conferencia_valores: valores })
    .eq("id", sessaoId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath(`/financeiro/caixa/${sessaoId}`);
  return { sucesso: true };
}

export async function adicionarMovimento(
  sessaoId: number,
  tipo: "entrada" | "saida",
  valor: number,
  descricao: string,
  categoria: string,
): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (valor <= 0) return { sucesso: false, erro: "Valor deve ser maior que zero." };
  if (!descricao.trim()) return { sucesso: false, erro: "Informe a descrição." };

  const { error } = await supabase.from("movimentacoes_caixa").insert({
    sessao_id: sessaoId,
    tipo,
    valor,
    descricao: descricao.trim(),
    categoria: categoria || "outros",
    usuario_id: user.id,
  });

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath(`/financeiro/caixa/${sessaoId}`);
  return { sucesso: true };
}
