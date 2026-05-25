import { CobrancaForm } from "./CobrancaForm";

export default function NovaCobrancaPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/cobrancas" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4">
          ← Voltar para Cobranças
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">➕ Nova cobrança</h1>
        <p className="text-zinc-500 text-sm mt-1">Registre uma cobrança para uma cliente.</p>
      </div>
      <CobrancaForm />
    </div>
  );
}
