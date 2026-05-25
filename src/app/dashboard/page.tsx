import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pega o nome do perfil do banco (se existir)
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel")
    .eq("id", user!.id)
    .single();

  const nomeExibicao = perfil?.nome ?? user?.email ?? "usuário";

  // Busca os números reais para os cards
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeISO = hoje.toISOString();

  const [
    { count: totalProdutos },
    { count: vendasHoje },
    { count: estoqueBaixo },
    { data: faturamentoData },
  ] = await Promise.all([
    supabase.from("produtos").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("vendas").select("*", { count: "exact", head: true })
      .eq("status", "concluida")
      .gte("criado_em", hojeISO),
    supabase.from("variacoes").select("*", { count: "exact", head: true })
      .gt("estoque_minimo", 0)
      .filter("estoque_atual", "lte", "estoque_minimo"),
    supabase.from("vendas").select("total")
      .eq("status", "concluida")
      .gte("criado_em", hojeISO),
  ]);

  const faturamentoHoje = faturamentoData?.reduce((acc, v) => acc + (v.total ?? 0), 0) ?? 0;

  const cards = [
    {
      label: "Produtos cadastrados",
      valor: String(totalProdutos ?? 0),
      icon: "👗",
    },
    {
      label: "Vendas hoje",
      valor: String(vendasHoje ?? 0),
      icon: "🛒",
    },
    {
      label: "Estoque baixo",
      valor: String(estoqueBaixo ?? 0),
      icon: "⚠️",
    },
    {
      label: "Faturamento hoje",
      valor: `R$ ${faturamentoHoje.toFixed(2).replace(".", ",")}`,
      icon: "💰",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">

      {/* Boas-vindas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-800">
          Olá, {nomeExibicao}! 👋
        </h2>
        <p className="text-zinc-500 mt-1 text-sm">
          Aqui está o resumo da sua loja hoje,{" "}
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          .
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-2xl font-bold text-zinc-800">{card.valor}</div>
            <div className="text-sm text-zinc-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Próximos passos */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h3 className="font-semibold text-zinc-800 mb-4">
          🚀 Próximos passos
        </h3>
        <ol className="space-y-3 text-sm text-zinc-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </span>
            <span>
              <strong>Cadastrar produtos</strong> — adicione as peças da loja
              com tamanhos, cores e preços
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
              2
            </span>
            <span>
              <strong>Importar do Bling</strong> — trazer os produtos que já
              existem no Bling pra cá
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
              3
            </span>
            <span>
              <strong>Cadastrar atendentes</strong> — criar o login de cada
              funcionária
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
