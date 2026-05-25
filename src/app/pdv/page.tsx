import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PDVCaixa } from "./PDVCaixa";

export default async function PDVPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: produtos } = await supabase
    .from("produtos")
    .select(
      `id, nome, codigo,
       variacoes ( id, tamanho, cor, preco_venda, estoque_atual )`
    )
    .eq("ativo", true)
    .order("nome");

  // Busca as listas de preço ativas
  const { data: listas } = await supabase
    .from("listas_precos")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  // Busca todos os itens das listas
  const { data: itensListas } = await supabase
    .from("lista_preco_itens")
    .select("lista_id, produto_id, preco");

  // Agrupa os itens por lista_id
  const itensPorLista = (itensListas ?? []).reduce<
    Record<number, { produto_id: number; preco: number }[]>
  >((acc, item) => {
    if (!acc[item.lista_id]) acc[item.lista_id] = [];
    acc[item.lista_id].push({ produto_id: item.produto_id, preco: item.preco });
    return acc;
  }, {});

  // Monta o formato esperado pelo PDVCaixa
  const listasPrecos = (listas ?? []).map((l) => ({
    id: l.id,
    nome: l.nome,
    itens: itensPorLista[l.id] ?? [],
  }));

  return <PDVCaixa produtos={produtos ?? []} listasPrecos={listasPrecos} />;
}
