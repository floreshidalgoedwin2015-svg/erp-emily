"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoDeposito = { sucesso: boolean; erro?: string };

export async function criarDeposito(
  nome: string,
  descricao: string,
  padrao: boolean,
): Promise<ResultadoDeposito> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!nome.trim()) return { sucesso: false, erro: "Informe o nome do depósito." };

  // Se marcar como padrão, desmarca os outros
  if (padrao) {
    await supabase.from("depositos").update({ padrao: false }).neq("id", 0);
  }

  const { error } = await supabase.from("depositos").insert({
    nome: nome.trim(),
    descricao: descricao.trim() || null,
    padrao,
    ativo: true,
  });

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/estoque/depositos");
  return { sucesso: true };
}

export async function editarDeposito(
  id: number,
  nome: string,
  descricao: string,
  padrao: boolean,
): Promise<ResultadoDeposito> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!nome.trim()) return { sucesso: false, erro: "Informe o nome do depósito." };

  if (padrao) {
    await supabase.from("depositos").update({ padrao: false }).neq("id", id);
  }

  const { error } = await supabase.from("depositos").update({
    nome: nome.trim(),
    descricao: descricao.trim() || null,
    padrao,
  }).eq("id", id);

  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/estoque/depositos");
  return { sucesso: true };
}

export async function toggleDepositoAtivo(
  id: number,
  ativo: boolean,
): Promise<ResultadoDeposito> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase.from("depositos").update({ ativo }).eq("id", id);
  if (error) return { sucesso: false, erro: error.message };
  revalidatePath("/estoque/depositos");
  return { sucesso: true };
}
