"use client";

import { useState, useRef } from "react";
import {
  importarProdutosBling,
  type ProdutoBling,
  type VariacaoBling,
  type ResultadoImportacao,
} from "./actions";
import * as XLSX from "xlsx";

type Etapa = "upload" | "preview" | "importando" | "concluido";
type FormatoArquivo = "simples" | "variantes" | null;

export function ImportarForm() {
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [produtos, setProdutos] = useState<ProdutoBling[]>([]);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [formato, setFormato] = useState<FormatoArquivo>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function parsePreco(val: unknown): number {
    return (
      parseFloat(
        String(val || "0")
          .replace("R$", "")
          .replace(",", ".")
          .trim()
      ) || 0
    );
  }

  // ── Parsing unificado: trata produtos simples E com variantes ──
  //
  // Como funciona o export do Bling com variantes:
  //   - Linha sem "Código Pai" = produto pai (ou produto simples)
  //   - Linha com "Código Pai" = variante do produto pai
  //   - Descrição da variante = "Cor:X;Tamanho:Y"
  //
  // O mesmo arquivo pode ter produtos simples e com variantes misturados.
  function parsearProdutos(linhas: Record<string, unknown>[]): ProdutoBling[] {
    const mapa = new Map<string, ProdutoBling>();
    const ordem: string[] = [];

    for (const linha of linhas) {
      // Filtra inativos
      const situacao = String(
        linha["Situação"] || linha["Situacao"] || ""
      ).trim();
      if (situacao && situacao !== "Ativo") continue;

      const descricao = String(
        linha["Descrição"] || linha["Descricao"] || ""
      ).trim();
      const codigo = String(
        linha["Código"] || linha["Codigo"] || ""
      ).trim();
      const codigoPai = String(linha["Código Pai"] || "").trim();

      if (!descricao || !codigo) continue;

      if (!codigoPai) {
        // ── Produto pai ou produto simples ──
        const produto: ProdutoBling = {
          nome: descricao,
          codigo,
          preco_venda: parsePreco(linha["Preço"] || linha["Preco"]),
          preco_custo: parsePreco(
            linha["Preço de custo"] || linha["Preco de custo"]
          ),
          estoque: parseInt(String(linha["Estoque"] || "0")) || 0,
          categoria: String(
            linha["Categoria do produto"] ||
              linha["Grupo de produtos"] ||
              "Outros"
          ),
          codigo_barras: String(linha["GTIN/EAN"] || "").trim(),
          situacao: "Ativo",
        };
        mapa.set(codigo, produto);
        ordem.push(codigo);
      } else {
        // ── Variante — anexa ao produto pai ──
        const pai = mapa.get(codigoPai);
        if (!pai) continue; // pai filtrado ou não encontrado

        if (!pai.variacoes) pai.variacoes = [];

        // Extrai cor e tamanho da descrição: "Cor:AZUL MARINHO;Tamanho:G1"
        const cor = descricao.match(/Cor:([^;]+)/)?.[1]?.trim() ?? null;
        const tamanho =
          descricao.match(/Tamanho:([^;]+)/)?.[1]?.trim() ?? null;

        const variante: VariacaoBling = {
          codigo,
          cor,
          tamanho,
          // Preço vem da variante; se zero, herda do pai
          preco_venda:
            parsePreco(linha["Preço"] || linha["Preco"]) ||
            pai.preco_venda,
          preco_custo:
            parsePreco(
              linha["Preço de custo"] || linha["Preco de custo"]
            ) || pai.preco_custo,
          estoque: parseInt(String(linha["Estoque"] || "0")) || 0,
          // EAN é igual em todas as variantes no export do Bling — ignorar
          // para não violar a restrição UNIQUE do banco
          codigo_barras: null,
        };
        pai.variacoes.push(variante);
      }
    }

    return ordem.map((cod) => mapa.get(cod)!).filter(Boolean);
  }

  function processarArquivo(arquivo: File) {
    setErroArquivo("");
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const dados = new Uint8Array(e.target?.result as ArrayBuffer);
        const isCSV = arquivo.name.toLowerCase().endsWith(".csv");

        // CSVs do Bling usam ponto-e-vírgula como separador
        let workbook: XLSX.WorkBook;
        if (isCSV) {
          const texto = new TextDecoder("utf-8").decode(dados);
          workbook = XLSX.read(texto, { type: "string", FS: ";" });
        } else {
          workbook = XLSX.read(dados, { type: "array" });
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhas: Record<string, unknown>[] =
          XLSX.utils.sheet_to_json(sheet);

        if (linhas.length === 0) {
          setErroArquivo("Nenhum dado encontrado no arquivo.");
          return;
        }

        const processados = parsearProdutos(linhas);

        if (processados.length === 0) {
          setErroArquivo(
            "Nenhum produto encontrado. Verifique se é a exportação correta do Bling."
          );
          return;
        }

        // Detecta o formato pelo resultado do parse
        const temVariantes = processados.some(
          (p) => (p.variacoes?.length ?? 0) > 0
        );
        setFormato(temVariantes ? "variantes" : "simples");
        setProdutos(processados);
        setEtapa("preview");
      } catch {
        setErroArquivo(
          "Erro ao ler o arquivo. Certifique-se de que é um arquivo exportado do Bling."
        );
      }
    };

    reader.readAsArrayBuffer(arquivo);
  }

  async function confirmarImportacao() {
    setEtapa("importando");
    const res = await importarProdutosBling(produtos);
    setResultado(res);
    setEtapa("concluido");
  }

  // ── Etapa 1: Upload ──
  if (etapa === "upload") {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-8 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">📥</div>
        <h2 className="text-xl font-semibold text-zinc-800 mb-2">
          Importar produtos do Bling
        </h2>
        <p className="text-sm text-zinc-500 mb-2">
          Aceita dois tipos de exportação do Bling:
        </p>
        <ul className="text-xs text-zinc-500 mb-6 space-y-1.5 text-left max-w-xs mx-auto bg-zinc-50 rounded-xl p-3">
          <li>
            📊 <strong>.xlsx</strong> — exportação de dados dos produtos
            (simples)
          </li>
          <li>
            🎨 <strong>.csv de variantes</strong> — produtos com cor e tamanho
            separados
          </li>
        </ul>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-amber-200 rounded-2xl p-10 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition mb-4"
        >
          <div className="text-3xl mb-2">📂</div>
          <p className="text-sm font-medium text-amber-700">
            Clique para selecionar o arquivo
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Formatos aceitos: .xlsx, .xls, .csv
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) processarArquivo(arquivo);
          }}
        />

        {erroArquivo && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {erroArquivo}
          </div>
        )}
      </div>
    );
  }

  // ── Etapa 2: Preview ──
  if (etapa === "preview") {
    const totalVariacoes = produtos.reduce(
      (acc, p) => acc + (p.variacoes?.length ?? 0),
      0
    );
    const comVariantes = produtos.filter(
      (p) => (p.variacoes?.length ?? 0) > 0
    ).length;
    const simples = produtos.length - comVariantes;
    const comEstoque = produtos.filter((p) => p.estoque > 0).length;

    return (
      <div className="space-y-6 max-w-4xl">
        {formato === "variantes" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            🎨 <strong>Formato com variantes detectado!</strong> Cada cor +
            tamanho será cadastrado separadamente no estoque. Os preços já vêm
            do Bling.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            ✅ Arquivo lido com sucesso!
          </h2>

          {formato === "variantes" ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-amber-50">
                <div className="text-2xl font-bold text-amber-700">
                  {produtos.length}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  modelo{produtos.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50">
                <div className="text-2xl font-bold text-blue-700">
                  {totalVariacoes}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  variações no total
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-50">
                <div className="text-2xl font-bold text-zinc-600">
                  {simples}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  produto{simples !== 1 ? "s" : ""} simples
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-amber-50">
                <div className="text-2xl font-bold text-amber-700">
                  {produtos.length}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  produtos encontrados
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-700">
                  {comEstoque}
                </div>
                <div className="text-xs text-zinc-500 mt-1">com estoque</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-50">
                <div className="text-2xl font-bold text-zinc-700">
                  {produtos.length - comEstoque}
                </div>
                <div className="text-xs text-zinc-500 mt-1">sem estoque</div>
              </div>
            </div>
          )}

          <p className="text-sm text-zinc-600 mb-4">
            Confira abaixo. Se estiver certo, clique em{" "}
            <strong>"Importar tudo"</strong>.
          </p>

          <div className="overflow-auto rounded-xl border border-zinc-100 mb-6">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Produto
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 hidden sm:table-cell">
                    Código
                  </th>
                  {formato === "variantes" ? (
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                      Cor / Tamanho
                    </th>
                  ) : (
                    <>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 hidden md:table-cell">
                        Categoria
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500">
                        Preço
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500">
                        Estoque
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {produtos.slice(0, 10).map((p, i) => (
                  <tr key={i} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-zinc-800">{p.nome}</div>
                      {formato === "variantes" && p.preco_venda > 0 && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          R$ {p.preco_venda.toFixed(2).replace(".", ",")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 hidden sm:table-cell text-xs">
                      {p.codigo}
                    </td>
                    {formato === "variantes" ? (
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {p.variacoes?.map((v, vi) => (
                            <span
                              key={vi}
                              className="inline-block bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5 text-xs text-blue-700"
                            >
                              {[v.cor, v.tamanho].filter(Boolean).join(" / ")}
                            </span>
                          ))}
                          {(p.variacoes?.length ?? 0) === 0 && (
                            <span className="text-xs text-zinc-400">
                              sem variantes
                            </span>
                          )}
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-700">
                          R$ {p.preco_venda.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={
                              p.estoque > 0
                                ? "text-emerald-600 font-medium"
                                : "text-zinc-400"
                            }
                          >
                            {p.estoque}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {produtos.length > 10 && (
              <div className="px-4 py-2 text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50">
                ... e mais {produtos.length - 10} produtos
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setEtapa("upload");
                setProdutos([]);
                setFormato(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition"
            >
              Trocar arquivo
            </button>
            <button
              onClick={confirmarImportacao}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              📥 Importar {produtos.length} produto
              {produtos.length !== 1 ? "s" : ""}
              {formato === "variantes" && totalVariacoes > 0
                ? ` (${totalVariacoes} variações)`
                : ""}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Etapa 3: Importando ──
  if (etapa === "importando") {
    const totalVariacoes = produtos.reduce(
      (acc, p) => acc + (p.variacoes?.length ?? 0),
      0
    );
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4 animate-bounce">⏳</div>
        <h2 className="text-xl font-semibold text-zinc-800 mb-2">
          Importando produtos...
        </h2>
        <p className="text-sm text-zinc-500">
          Aguarde enquanto salvamos {produtos.length} produto
          {produtos.length !== 1 ? "s" : ""}
          {totalVariacoes > 0 ? ` com ${totalVariacoes} variações` : ""} no
          banco de dados.
          <br />
          Isso pode levar alguns segundos.
        </p>
      </div>
    );
  }

  // ── Etapa 4: Concluído ──
  if (etapa === "concluido" && resultado) {
    const sucesso = !resultado.erro && resultado.importados > 0;
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-8 shadow-sm max-w-lg mx-auto text-center">
        <div className="text-5xl mb-4">{sucesso ? "🎉" : "⚠️"}</div>
        <h2 className="text-xl font-semibold text-zinc-800 mb-6">
          {sucesso ? "Importação concluída!" : "Importação com avisos"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-emerald-50">
            <div className="text-3xl font-bold text-emerald-700">
              {resultado.importados}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              importados com sucesso
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50">
            <div className="text-3xl font-bold text-zinc-600">
              {resultado.ignorados}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              já existiam (ignorados)
            </div>
          </div>
        </div>

        {resultado.erros.length > 0 && (
          <div className="text-left rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-sm">
            <p className="font-medium text-amber-700 mb-2">
              ⚠️ {resultado.erros.length} produto(s) com erro:
            </p>
            <ul className="space-y-1 text-amber-600 text-xs">
              {resultado.erros.slice(0, 5).map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
              {resultado.erros.length > 5 && (
                <li>... e mais {resultado.erros.length - 5}</li>
              )}
            </ul>
          </div>
        )}

        <a
          href="/produtos"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
        >
          Ver produtos importados →
        </a>
      </div>
    );
  }

  return null;
}
