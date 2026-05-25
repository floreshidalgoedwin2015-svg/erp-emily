"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { atualizarProduto } from "./actions";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type Categoria = { id: number; nome: string };
type Fornecedor = { id: number; nome: string };

type VariacaoDb = {
  id: number;
  tamanho: string | null;
  cor: string | null;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_minimo: number;
};

type ProdutoDb = {
  id: number;
  nome: string;
  codigo: string | null;
  foto_url: string | null;
  categoria_id: number | null;
  fornecedor_id: number | null;
  categorias: { id: number; nome: string } | null;
  fornecedores: { id: number; nome: string } | null;
  variacoes: VariacaoDb[];
};

type VariacaoForm = {
  key: string;
  id?: number;
  tamanho: string;
  cor: string;
  preco_venda: string;
  preco_custo: string;
  estoque_atual: string;
  estoque_anterior: number;
};

const TAMANHOS = [
  "PP", "P", "M", "G", "GG", "XGG", "XXXG",
  "G1", "G2", "G3", "G4", "G5",
  "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60",
  "Único",
];

function variacaoDbParaForm(v: VariacaoDb): VariacaoForm {
  return {
    key: String(v.id),
    id: v.id,
    tamanho: v.tamanho ?? "",
    cor: v.cor ?? "",
    preco_venda: v.preco_venda.toFixed(2),
    preco_custo: v.preco_custo.toFixed(2),
    estoque_atual: String(v.estoque_atual),
    estoque_anterior: v.estoque_atual,
  };
}

function novaVariacaoForm(): VariacaoForm {
  return {
    key: Math.random().toString(36).slice(2),
    id: undefined,
    tamanho: "",
    cor: "",
    preco_venda: "0,00",
    preco_custo: "0,00",
    estoque_atual: "0",
    estoque_anterior: 0,
  };
}

function calcMargem(venda: string, custo: string): string {
  const v = parseFloat(venda.replace(",", ".")) || 0;
  const c = parseFloat(custo.replace(",", ".")) || 0;
  if (v <= 0) return "—";
  const m = ((v - c) / v) * 100;
  return `${m.toFixed(0)}%`;
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400";

export function EditarProdutoForm({
  produto,
  categorias,
  fornecedores,
}: {
  produto: ProdutoDb;
  categorias: Categoria[];
  fornecedores: Fornecedor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(produto.nome);
  const [categoriaId, setCategoriaId] = useState(String(produto.categoria_id ?? ""));
  const [fornecedorId, setFornecedorId] = useState(String(produto.fornecedor_id ?? ""));
  const [variacoes, setVariacoes] = useState<VariacaoForm[]>(
    produto.variacoes.length > 0
      ? produto.variacoes.map(variacaoDbParaForm)
      : [novaVariacaoForm()]
  );
  const [fotoPreview, setFotoPreview] = useState<string | null>(produto.foto_url);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function uploadFoto(file: File): Promise<string | null> {
    const supabase = createBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file, { upsert: true });
    if (error) { setErro("Erro ao fazer upload da imagem: " + error.message); return null; }
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Edição em massa ──
  const [bulkVenda, setBulkVenda] = useState("");
  const [bulkCusto, setBulkCusto] = useState("");
  const [bulkEstoque, setBulkEstoque] = useState("");

  function aplicarEmTodas() {
    if (!bulkVenda && !bulkCusto && bulkEstoque === "") return;
    setVariacoes((prev) =>
      prev.map((v) => ({
        ...v,
        ...(bulkVenda ? { preco_venda: bulkVenda } : {}),
        ...(bulkCusto ? { preco_custo: bulkCusto } : {}),
        ...(bulkEstoque !== "" ? { estoque_atual: bulkEstoque } : {}),
      }))
    );
    setBulkVenda("");
    setBulkCusto("");
    setBulkEstoque("");
  }

  function atualizarVariacao(key: string, campo: keyof VariacaoForm, valor: string) {
    setVariacoes((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [campo]: valor } : v))
    );
  }

  function adicionarVariacao() {
    setVariacoes((prev) => [...prev, novaVariacaoForm()]);
  }

  function removerVariacao(key: string) {
    if (variacoes.length === 1) return;
    setVariacoes((prev) => prev.filter((v) => v.key !== key));
  }

  function handleSalvar() {
    if (!nome.trim()) {
      setErro("O nome do produto é obrigatório.");
      return;
    }
    setErro("");
    startTransition(async () => {
      let novaFotoUrl: string | null | undefined = undefined;
      if (fotoFile) {
        setUploadingFoto(true);
        novaFotoUrl = await uploadFoto(fotoFile);
        setUploadingFoto(false);
        if (novaFotoUrl === null) return; // upload falhou, erro já setado
      }

      const resultado = await atualizarProduto(
        produto.id,
        {
          nome: nome.trim(),
          categoria_id: categoriaId ? parseInt(categoriaId) : null,
          fornecedor_id: fornecedorId ? parseInt(fornecedorId) : null,
          foto_url: novaFotoUrl,
        },
        variacoes.map((v) => ({
          id: v.id,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          preco_venda: parseFloat(v.preco_venda.replace(",", ".")) || 0,
          preco_custo: parseFloat(v.preco_custo.replace(",", ".")) || 0,
          estoque_atual: parseInt(v.estoque_atual) || 0,
          estoque_anterior: v.estoque_anterior,
        }))
      );
      if (resultado.sucesso) {
        setSucesso(true);
        setTimeout(() => router.push("/produtos"), 1200);
      } else {
        setErro(resultado.erro ?? "Erro ao salvar. Tente novamente.");
      }
    });
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-12 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-zinc-800">Produto salvo com sucesso!</h2>
        <p className="text-sm text-zinc-500 mt-2">Redirecionando para a lista de produtos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Informações básicas ── */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-800 mb-5">📦 Informações básicas</h2>
        <div className="space-y-4">

          {/* Foto do produto */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Foto do produto</label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div
                className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-400 transition shrink-0"
                onClick={() => fotoInputRef.current?.click()}
              >
                {fotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👗</span>
                )}
              </div>
              {/* Botões */}
              <div>
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  className="block px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition mb-2"
                >
                  📷 {fotoPreview ? "Trocar foto" : "Adicionar foto"}
                </button>
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={() => { setFotoPreview(null); setFotoFile(null); }}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Remover foto
                  </button>
                )}
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFotoFile(file);
                    setFotoPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nome do produto <span className="text-amber-600">*</span>
            </label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} placeholder="Ex: Vestido Midi Floral" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputCls}>
                <option value="">Sem categoria</option>
                {categorias.map((c) => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Fornecedor</label>
              <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inputCls}>
                <option value="">Sem fornecedor</option>
                {fornecedores.map((f) => <option key={f.id} value={String(f.id)}>{f.nome}</option>)}
              </select>
            </div>
          </div>
          {produto.codigo && (
            <p className="text-xs text-zinc-400">SKU: <span className="font-mono">{produto.codigo}</span></p>
          )}
        </div>
      </div>

      {/* ── Variações ── */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-800">
            🎨 Variações <span className="text-sm font-normal text-zinc-400">({variacoes.length})</span>
          </h2>
          <button type="button" onClick={adicionarVariacao} className="text-sm text-amber-700 hover:text-amber-800 font-medium">
            + Adicionar
          </button>
        </div>

        {/* Edição em massa */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-3 uppercase tracking-wide">⚡ Edição em massa</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">R$ Venda (todas)</label>
              <input type="text" inputMode="decimal" value={bulkVenda} onChange={(e) => setBulkVenda(e.target.value)} placeholder="Ex: 175,00" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">R$ Custo (todas)</label>
              <input type="text" inputMode="decimal" value={bulkCusto} onChange={(e) => setBulkCusto(e.target.value)} placeholder="Ex: 44,00" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Estoque (todas)</label>
              <input type="number" min="0" value={bulkEstoque} onChange={(e) => setBulkEstoque(e.target.value)} placeholder="Ex: 10" className={inputCls} />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={aplicarEmTodas} className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition">
                Aplicar ▶
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-2">Deixe em branco os campos que não quer alterar.</p>
        </div>

        {/* Cabeçalho desktop */}
        <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_1fr_1fr_0.7fr_auto] gap-2 px-2 mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Cor</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase">Tamanho</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase">R$ Venda</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase">R$ Custo</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase">Estoque</span>
          <span />
        </div>

        <div className="space-y-2">
          {variacoes.map((v) => {
            const estoqueAlterado = v.id !== undefined && parseInt(v.estoque_atual) !== v.estoque_anterior;
            const estoqueBaixo = !estoqueAlterado && parseInt(v.estoque_atual) === 0;
            return (
              <div key={v.key} className={`rounded-xl border p-3 transition ${estoqueAlterado ? "border-amber-200 bg-amber-50" : estoqueBaixo ? "border-red-100 bg-red-50/40" : "border-zinc-100 bg-zinc-50/50"}`}>
                {/* Mobile */}
                <div className="grid grid-cols-2 gap-2 md:hidden">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Cor</label>
                    <input type="text" value={v.cor} onChange={(e) => atualizarVariacao(v.key, "cor", e.target.value)} placeholder="PRETO" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Tamanho</label>
                    <select value={v.tamanho} onChange={(e) => atualizarVariacao(v.key, "tamanho", e.target.value)} className={inputCls}>
                      <option value="">—</option>
                      {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">R$ Venda</label>
                    <input type="text" inputMode="decimal" value={v.preco_venda} onChange={(e) => atualizarVariacao(v.key, "preco_venda", e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">R$ Custo <span className="text-emerald-600">{calcMargem(v.preco_venda, v.preco_custo)}</span></label>
                    <input type="text" inputMode="decimal" value={v.preco_custo} onChange={(e) => atualizarVariacao(v.key, "preco_custo", e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Estoque {estoqueAlterado && <span className="text-amber-600">● alterado</span>}{estoqueBaixo && <span className="text-red-500">⚠ zerado</span>}
                    </label>
                    <input type="number" min="0" value={v.estoque_atual} onChange={(e) => atualizarVariacao(v.key, "estoque_atual", e.target.value)} className={inputCls} />
                  </div>
                  {variacoes.length > 1 && !v.id && (
                    <div className="flex items-center col-span-2">
                      <button type="button" onClick={() => removerVariacao(v.key)} className="text-xs text-red-400 hover:text-red-600">Remover variação</button>
                    </div>
                  )}
                </div>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_1fr_1fr_0.7fr_auto] gap-2 items-start">
                  <input type="text" value={v.cor} onChange={(e) => atualizarVariacao(v.key, "cor", e.target.value)} placeholder="PRETO" className={inputCls} />
                  <select value={v.tamanho} onChange={(e) => atualizarVariacao(v.key, "tamanho", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" inputMode="decimal" value={v.preco_venda} onChange={(e) => atualizarVariacao(v.key, "preco_venda", e.target.value)} placeholder="0,00" className={inputCls} />
                  <div>
                    <input type="text" inputMode="decimal" value={v.preco_custo} onChange={(e) => atualizarVariacao(v.key, "preco_custo", e.target.value)} placeholder="0,00" className={inputCls} />
                    <span className="text-xs text-emerald-600 font-medium mt-0.5 block">margem {calcMargem(v.preco_venda, v.preco_custo)}</span>
                  </div>
                  <div className="relative">
                    <input type="number" min="0" value={v.estoque_atual} onChange={(e) => atualizarVariacao(v.key, "estoque_atual", e.target.value)} className={`${inputCls} ${estoqueAlterado ? "border-amber-400 bg-amber-50" : ""} ${estoqueBaixo ? "border-red-300" : ""}`} />
                    {estoqueAlterado && <span className="absolute -top-4 left-0 text-xs text-amber-600 whitespace-nowrap">era {v.estoque_anterior}</span>}
                  </div>
                  <div className="flex justify-center pt-1.5">
                    {variacoes.length > 1 && !v.id ? (
                      <button type="button" onClick={() => removerVariacao(v.key)} className="text-zinc-300 hover:text-red-400 transition text-lg leading-none" title="Remover">×</button>
                    ) : <span className="w-5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 mt-4">💡 Altere o Estoque para atualizar o saldo — o sistema registra o ajuste automaticamente.</p>
      </div>

      {/* ── Erro ── */}
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>
      )}

      {/* ── Ações ── */}
      <div className="flex gap-3 justify-end pb-8">
        <a href="/produtos" className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending} className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition">
          {uploadingFoto ? "📤 Fazendo upload..." : isPending ? "Salvando..." : "💾 Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
