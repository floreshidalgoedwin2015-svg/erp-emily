"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarCliente } from "./actions";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type ClienteDb = {
  id: number;
  nome: string;
  fantasia: string | null;
  codigo: string | null;
  tipo_pessoa: string | null;
  cpf: string | null;
  rg: string | null;
  inscricao_estadual: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  cep: string | null;
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  whatsapp: string | null;
  celular: string | null;
  fone: string | null;
  email: string | null;
  instagram: string | null;
  observacoes: string | null;
};

type VendaHistorico = {
  id: number;
  numero_venda: number;
  total: number;
  forma_pagamento: string;
  criado_em: string;
};

const FORMAS: Record<string, string> = {
  pix: "PIX", dinheiro: "Dinheiro", debito: "Débito", credito: "Crédito", misto: "Misto",
};

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

function wppLink(wpp: string) {
  const d = wpp.replace(/\D/g, "");
  return `https://wa.me/${d.startsWith("55") ? d : `55${d}`}`;
}

const inp =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

export function EditarClienteForm({
  cliente,
  historico,
}: {
  cliente: ClienteDb;
  historico: VendaHistorico[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dados cadastrais
  const [nome, setNome] = useState(cliente.nome);
  const [fantasia, setFantasia] = useState(cliente.fantasia ?? "");
  const [codigo, setCodigo] = useState(cliente.codigo ?? "");
  const [tipoPessoa, setTipoPessoa] = useState(cliente.tipo_pessoa ?? "fisica");
  const [cpf, setCpf] = useState(cliente.cpf ?? "");
  const [rg, setRg] = useState(cliente.rg ?? "");
  const [inscEstadual, setInscEstadual] = useState(cliente.inscricao_estadual ?? "");
  const [dataNasc, setDataNasc] = useState(cliente.data_nascimento ?? "");
  const [sexo, setSexo] = useState(cliente.sexo ?? "");

  // Endereço
  const [cep, setCep] = useState(cliente.cep ?? "");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [uf, setUf] = useState(cliente.uf ?? "");
  const [cidade, setCidade] = useState(cliente.cidade ?? "");
  const [bairro, setBairro] = useState(cliente.bairro ?? "");
  const [endereco, setEndereco] = useState(cliente.endereco ?? "");
  const [numero, setNumero] = useState(cliente.numero ?? "");
  const [complemento, setComplemento] = useState(cliente.complemento ?? "");

  // Contato
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? "");
  const [celular, setCelular] = useState(cliente.celular ?? "");
  const [fone, setFone] = useState(cliente.fone ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [instagram, setInstagram] = useState(cliente.instagram ?? "");

  // Obs
  const [observacoes, setObservacoes] = useState(cliente.observacoes ?? "");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function buscarCep(valor: string) {
    const digits = valor.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setUf(data.uf ?? "");
      }
    } catch { /* ignora */ }
    setBuscandoCep(false);
  }

  function handleSalvar() {
    if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
    setErro("");
    startTransition(async () => {
      const resultado = await atualizarCliente(cliente.id, {
        nome: nome.trim(),
        fantasia: fantasia.trim() || null,
        codigo: codigo.trim() || null,
        tipo_pessoa: tipoPessoa,
        cpf: cpf.trim() || null,
        rg: rg.trim() || null,
        inscricao_estadual: inscEstadual.trim() || null,
        data_nascimento: dataNasc || null,
        sexo: sexo || null,
        cep: cep.trim() || null,
        uf: uf || null,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        endereco: endereco.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        whatsapp: whatsapp.trim() || null,
        celular: celular.trim() || null,
        fone: fone.trim() || null,
        email: email.trim() || null,
        instagram: instagram.trim() || null,
        observacoes: observacoes.trim() || null,
      });
      if (resultado.sucesso) {
        setSucesso(true);
        setTimeout(() => router.push("/clientes"), 1200);
      } else {
        setErro(resultado.erro);
      }
    });
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-12 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-zinc-800">Cliente salvo com sucesso!</h2>
        <p className="text-sm text-zinc-500 mt-2">Redirecionando para a lista...</p>
      </div>
    );
  }

  const totalGasto = historico.reduce((s, v) => s + v.total, 0);

  return (
    <div className="space-y-5">

      {/* ── Dados cadastrais ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados cadastrais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={lbl}>Nome <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className={inp} />
          </div>
          <div>
            <label className={lbl}>Código</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Opcional" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Fantasia / Apelido</label>
            <input value={fantasia} onChange={(e) => setFantasia(e.target.value)} placeholder="Como a cliente é conhecida" className={inp} />
          </div>
          <div>
            <label className={lbl}>Tipo de pessoa</label>
            <select value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value)} className={inp}>
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className={lbl}>CPF</label>
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className={inp} />
          </div>
          <div>
            <label className={lbl}>RG</label>
            <input value={rg} onChange={(e) => setRg(e.target.value)} placeholder="0000000" className={inp} />
          </div>
          <div>
            <label className={lbl}>Insc. Estadual</label>
            <input value={inscEstadual} onChange={(e) => setInscEstadual(e.target.value)} placeholder="Opcional" className={inp} />
          </div>
          <div>
            <label className={lbl}>Data de nascimento</label>
            <input type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Sexo</label>
            <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={inp}>
              <option value="">Selecione</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Endereço ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Endereço</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className={lbl}>CEP</label>
            <div className="flex gap-1.5">
              <input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={(e) => buscarCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={inp}
              />
              <button
                type="button"
                onClick={() => buscarCep(cep)}
                disabled={buscandoCep}
                className="shrink-0 px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-sm transition disabled:opacity-50"
                title="Buscar CEP"
              >
                {buscandoCep ? "..." : "🔍"}
              </button>
            </div>
          </div>
          <div>
            <label className={lbl}>UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)} className={inp}>
              <option value="">UF</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Cidade</label>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inp} />
          </div>
          <div>
            <label className={lbl}>Bairro</label>
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, Av..." className={inp} />
          </div>
          <div>
            <label className={lbl}>Número</label>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Complemento</label>
            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." className={inp} />
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Contato</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={lbl}>WhatsApp</label>
            <div className="flex gap-1.5">
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(85) 99999-9999" className={inp} />
              {whatsapp && (
                <a href={wppLink(whatsapp)} target="_blank" rel="noreferrer"
                  className="shrink-0 flex items-center px-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition text-lg"
                  title="Abrir no WhatsApp">💬</a>
              )}
            </div>
          </div>
          <div>
            <label className={lbl}>Celular</label>
            <input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="(85) 99999-9999" className={inp} />
          </div>
          <div>
            <label className={lbl}>Fone</label>
            <input value={fone} onChange={(e) => setFone(e.target.value)} placeholder="(85) 3333-3333" className={inp} />
          </div>
          <div>
            <label className={lbl}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Instagram</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" className={inp} />
          </div>
        </div>
      </section>

      {/* ── Observações ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Observações</h2>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          placeholder="Tamanho preferido, preferências de estilo, endereço de entrega..."
          className={inp + " resize-none"}
        />
      </section>

      {/* Erro */}
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <a href="/clientes" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
          Cancelar
        </a>
        <button type="button" onClick={handleSalvar} disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Salvar alterações"}
        </button>
      </div>

      {/* ── Histórico de compras ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">🧾 Histórico de compras</h2>
          {historico.length > 0 && (
            <span className="text-xs text-zinc-500">
              {historico.length} venda{historico.length !== 1 ? "s" : ""} •{" "}
              <span className="font-semibold text-amber-700">{fmt(totalGasto)}</span> no total
            </span>
          )}
        </div>

        {historico.length === 0 ? (
          <div className="p-10 text-center text-zinc-400 text-sm">
            Nenhuma compra registrada com o nome deste cliente.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Venda</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Pagamento</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Data</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {historico.map((v) => (
                <tr key={v.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-amber-700">#{v.numero_venda}</span>
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      {FORMAS[v.forma_pagamento] ?? v.forma_pagamento}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-zinc-500 text-xs">
                      {new Date(v.criado_em).toLocaleDateString("pt-BR")}{" "}
                      {new Date(v.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(v.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-amber-200 bg-amber-50">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-zinc-700">Total gasto</td>
                <td className="px-5 py-3 text-right font-bold text-amber-700 text-base">{fmt(totalGasto)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
