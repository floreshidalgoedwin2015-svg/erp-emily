import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/login/actions";

const menuItens = [
  { href: "/dashboard", icon: "🏠", label: "Início" },
  { href: "/produtos", icon: "👗", label: "Produtos" },
  { href: "/listas-precos", icon: "💲", label: "Listas de preço" },
  { href: "/estoque", icon: "📦", label: "Estoque" },
  { href: "/clientes", icon: "👤", label: "Clientes" },
  { href: "/fornecedores", icon: "🏭", label: "Fornecedores" },
  { href: "/compras", icon: "🛍️", label: "Pedidos de compra" },
  { href: "/estoque/conferencia", icon: "📋", label: "Conferência" },
  { href: "/pdv", icon: "🛒", label: "PDV — Vendas" },
  { href: "/pedidos-venda", icon: "📝", label: "Pedidos de venda" },
  { href: "/cobrancas", icon: "💰", label: "Cobranças" },
  { href: "/propostas", icon: "📋", label: "Propostas" },
  { href: "/financeiro/contas-pagar", icon: "💸", label: "Contas a pagar" },
  { href: "/financeiro/caixa", icon: "🏦", label: "Controle de caixa" },
  { href: "/relatorios", icon: "📊", label: "Relatórios" },
  { href: "/atendentes", icon: "👥", label: "Atendentes" },
  { href: "/importar", icon: "📥", label: "Importar Bling" },
  { href: "/configuracoes", icon: "⚙️", label: "Configurações" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-zinc-100">

      {/* Sidebar — preto com dourado */}
      <aside className="w-60 bg-zinc-950 flex flex-col shrink-0 shadow-xl">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-zinc-800">
          <h1 className="text-base font-bold text-amber-400 leading-tight tracking-wide">
            Emily Plus Size
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Sistema de Gestão</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItens.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-amber-400 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Rodapé */}
        <div className="p-3 border-t border-zinc-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {user.email}
            </p>
            <p className="text-xs text-zinc-600">Logada</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors text-left"
            >
              <span className="text-base">🚪</span>
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Área principal */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
