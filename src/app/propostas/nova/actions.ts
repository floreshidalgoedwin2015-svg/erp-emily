"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ItemProposta = {
  variacao_id: number | null;
  produto_nome: string;
  variacao_descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type DadosProposta = {
  cliente_nome: string;
  validade?: string | null;
  observacoes?: string | null;
};

export type ResultadoProposta =
  | { sucesso: true; id: number }
  | { sucesso: false; erro: string };

export async function criarProposta(
  dados: DadosProposta,
  itens: ItemProposta[],
): Promise<ResultadoProposta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!dados.cliente_nome?.trim()) return { sucesso: false, erro: "Informe o nome do cliente." };
  if (itens.length === 0) return { sucesso: false, erro: "Adicione pelo menos um item." };

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  const { data: proposta, error } = await supabase
    .from("propostas")
    .insert({
      cliente_nome: dados.cliente_nome.trim(),
      validade: dados.validade || null,
      observacoes: dados.observacoes?.trim() || null,
      total,
      status: "rascunho",
      usuario_id: user.id,
    })
    .select()
    .single();

  if (error || !proposta) return { sucesso: false, erro: error?.message ?? "Erro ao criar proposta." };

  const { error: erroItens } = await supabase.from("proposta_itens").insert(
    itens.map((i) => ({
      proposta_id: proposta.id,
      variacao_id: i.variacao_id,
      produto_nome: i.produto_nome,
      variacao_descricao: i.variacao_descricao,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario,
      subtotal: i.subtotal,
    })),
  );

  if (erroItens) return { sucesso: false, erro: erroItens.message };

  revalidatePath("/propostas");
  redirect(`/propostas/${proposta.id}`);
}

export async function atualizarStatusProposta(
  id: number,
  status: "enviada" | "aprovada" | "recusada",
): Promise<ResultadoProposta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("propostas")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
  return { sucesso: true, id };
}
