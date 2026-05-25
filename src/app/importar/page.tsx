import { ImportarForm } from "./ImportarForm";

export default function ImportarPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-700 transition mb-4"
        >
          ← Voltar para o Início
        </a>
        <h1 className="text-2xl font-bold text-zinc-800">📥 Importar produtos do Bling</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Selecione o arquivo exportado do Bling para trazer todos os seus produtos de uma vez.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
        <strong>💡 Como exportar do Bling:</strong> Acesse o Bling →{" "}
        <strong>Produtos</strong> → botão <strong>Exportar</strong> →{" "}
        <strong>Dados dos produtos</strong> → baixe o arquivo <strong>.xlsx</strong>
      </div>

      <ImportarForm />
    </div>
  );
}
