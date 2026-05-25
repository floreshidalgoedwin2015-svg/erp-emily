"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type DadosCliente = {
  nome: string;
  fantasia: string | null;
  codigo: string | null;
  tipo_pessoa: string;
  cpf: string | null;
  rg: string | null;
  inscricao_estadual: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  cep: string | null;
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  whatsapp: string | null;
  celular: string | null;
  fone: string | null;
  email: string | null;
  instagram: string | null;
  observacoes: string | null;
};

export type ResultadoCliente =
  | { sucesso: true }
  | { sucesso: false; erro: string };

export async function atualizarCliente(
  clienteId: number,
  dados: DadosCliente,
): Promise<ResultadoCliente> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("clientes")
    .update({
      ...dados,
      nome: dados.nome.trim(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", clienteId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { sucesso: true };
}
