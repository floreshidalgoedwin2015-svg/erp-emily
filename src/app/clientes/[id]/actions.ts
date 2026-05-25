"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ResultadoCliente = { sucesso: boolean; erro?: string };

export async function atualizarCliente(
  clienteId: number,
  dados: {
    nome: string;
    whatsapp: string | null;
    email: string | null;
    cpf: string | null;
    observacoes: string | null;
  },
): Promise<ResultadoCliente> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Não autorizado." };

  const { error } = await supabase
    .from("clientes")
    .update({
      nome: dados.nome,
      whatsapp: dados.whatsapp,
      email: dados.email,
      cpf: dados.cpf,
      observacoes: dados.observacoes,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", clienteId);

  if (error) return { sucesso: false, erro: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { sucesso: true };
}
