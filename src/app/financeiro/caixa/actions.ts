"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoCaixa = { sucesso: boolean; erro?: string; id?: number };

export async function abrirCaixa(saldoAbertura: number, observacoes?: string): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  // Verificar se já tem sessão aberta hoje
  const hoje = new Date().toISOString().split("T")[0];
  const { data: existente } = await supabase
    .from("sessoes_caixa")
    .select("id")
    .eq("status", "aberto")
    .eq("data", hoje)
    .maybeSingle();

  if (existente) return { sucesso: false, erro: "Já existe um caixa aberto hoje." };

  const { data, error } = await supabase
    .from("sessoes_caixa")
    .insert({ data: hoje, saldo_abertura: saldoAbertura, observacoes: observacoes || null, status: "aberto", usuario_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { sucesso: false, erro: error?.message ?? "Erro ao abrir caixa." };
  revalidatePath("/financeiro/caixa");
  return { sucesso: true, id: data.id };
}

export async function fecharCaixa(sessaoId: number, saldoFechamento: number, observacoes?: string): Promise<ResultadoCaixa> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("sessoes_caixa")
    .update({ status: "fechado", saldo_fechamento: saldoFechamento, observacoes: observacoes || null, fechado_em: new Date().toISOString() })
    .eq("id", sessaoId);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/financeiro/caixa");
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
  revalidatePath("/financeiro/caixa");
  return { sucesso: true };
}
