"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export async function criarFornecedor(
  dados: DadosFornecedor,
): Promise<ResultadoFornecedor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };
  if (!dados.nome.trim()) return { sucesso: false, erro: "O nome é obrigatório." };

  const { error } = await supabase.from("fornecedores").insert({
    ...dados,
    nome: dados.nome.trim(),
  });

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/fornecedores");
  redirect("/fornecedores");
}
