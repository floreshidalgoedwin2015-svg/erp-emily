import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { EditarFornecedorForm } from "./EditarFornecedorForm";

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fId = parseInt(id);
  if (isNaN(fId)) notFound();

  const supabase = await createClient();

  const { data: fornecedor } = await supabase
    .from("fornecedores")
    .select(`id, nome, fantasia, tipo_pessoa, cnpj, cpf, ie, contato,
             cep, uf, cidade, bairro, endereco, numero, complemento,
             whatsapp, celular, telefone, email, site, observacoes`)
    .eq("id", fId)
    .single();

  if (!fornecedor) notFound();

  const { data: pedidos } = await supabase
    .from("pedidos_compra")
    .select("id, status, total, criado_em")
    .eq("fornecedor_id", fId)
    .order("criado_em", { ascending: false })
    .limit(20);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/fornecedores" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Fornecedores
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">✏️ Editar fornecedor</h1>
        <p className="text-zinc-500 text-sm mt-1">Atualize os dados e veja os pedidos de compra.</p>
      </div>
      <EditarFornecedorForm
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fornecedor={fornecedor as any}
        pedidos={pedidos ?? []}
      />
    </div>
  );
}
