import { ClienteForm } from "./ClienteForm";

export default function NovoClientePage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para Clientes
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">➕ Novo cliente</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Cadastre um novo cliente para acompanhar o histórico de compras.
        </p>
      </div>

      <ClienteForm />
    </div>
  );
}
