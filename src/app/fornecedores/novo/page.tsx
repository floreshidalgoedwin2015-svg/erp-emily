import { FornecedorForm } from "./FornecedorForm";

export default function NovoFornecedorPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/fornecedores" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Fornecedores
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">➕ Novo fornecedor</h1>
        <p className="text-zinc-500 text-sm mt-1">Cadastre um novo fornecedor de mercadoria.</p>
      </div>
      <FornecedorForm />
    </div>
  );
}
