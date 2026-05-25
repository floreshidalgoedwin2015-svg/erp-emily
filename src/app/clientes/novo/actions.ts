"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EstadoFormCliente = { erro?: string } | undefined;

export async function criarCliente(
  state: EstadoFormCliente,
  formData: FormData,
): Promise<EstadoFormCliente> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autorizado." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { erro: "O nome é obrigatório." };

  const whatsapp = (formData.get("whatsapp") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const cpf = (formData.get("cpf") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const { error } = await supabase.from("clientes").insert({
    nome,
    whatsapp,
    email,
    cpf,
    observacoes,
  });

  if (error) return { erro: "Erro ao salvar: " + error.message };

  revalidatePath("/clientes");
  redirect("/clientes");
}
