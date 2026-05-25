"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type DadosFornecedor = {
  nome: string;
  fantasia: string | null;
  tipo_pessoa: string;
  cnpj: string | null;
  cpf: string | null;
  ie: string | null;
  contato: string | null;
  cep: string | null;
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  whatsapp: string | null;
  celular: string | null;
  telefone: string | null;
  email: string | null;
  site: string | null;
  observacoes: string | null;
};

export type ResultadoFornecedor =
  | { sucesso: true }
  | { sucesso: false; erro: string };

export async function atualizarFornecedor(
  fornecedorId: number,
  dados: DadosFornecedor,
): Promise<ResultadoFornecedor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("fornecedores")
    .update({ ...dados, nome: dados.nome.trim(), atualizado_em: new Date().toISOString() })
    .eq("id", fornecedorId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${fornecedorId}`);
  return { sucesso: true };
}
