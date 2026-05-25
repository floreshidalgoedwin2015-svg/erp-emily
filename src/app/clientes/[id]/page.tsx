import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { EditarClienteForm } from "./EditarClienteForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = parseInt(id);
  if (isNaN(clienteId)) notFound();

  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nome, whatsapp, email, cpf, observacoes")
    .eq("id", clienteId)
    .single();

  if (!cliente) notFound();

  // Busca histórico de vendas pelo nome do cliente (match exato ou parecido)
  const { data: historico } = await supabase
    .from("vendas")
    .select("id, numero_venda, total, forma_pagamento, criado_em")
    .ilike("cliente_nome", `%${cliente.nome}%`)
    .eq("status", "concluida")
    .order("criado_em", { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para Clientes
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">
          ✏️ Editar cliente
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Atualize os dados e veja o histórico de compras.
        </p>
      </div>

      <EditarClienteForm
        cliente={cliente}
        historico={historico ?? []}
      />
    </div>
  );
}
