"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarCliente } from "./actions";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const inp =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

export function ClienteForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dados cadastrais
  const [nome, setNome] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState("fisica");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [inscEstadual, setInscEstadual] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [sexo, setSexo] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");

  // Contato
  const [whatsapp, setWhatsapp] = useState("");
  const [celular, setCelular] = useState("");
  const [fone, setFone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");

  // Observações
  const [observacoes, setObservacoes] = useState("");

  const [erro, setErro] = useState("");

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
    } catch {
      // ignora erro de rede
    }
    setBuscandoCep(false);
  }

  function handleSalvar() {
    if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
    setErro("");
    startTransition(async () => {
      const resultado = await criarCliente({
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
      if (!resultado.sucesso) {
        setErro(resultado.erro);
      } else {
        router.push("/clientes");
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* ── Dados cadastrais ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">
          Dados cadastrais
        </h2>
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
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">
          Endereço
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {/* CEP */}
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
          {/* UF */}
          <div>
            <label className={lbl}>UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)} className={inp}>
              <option value="">UF</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {/* Cidade */}
          <div className="sm:col-span-2">
            <label className={lbl}>Cidade</label>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inp} />
          </div>
          {/* Bairro */}
          <div>
            <label className={lbl}>Bairro</label>
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={inp} />
          </div>
          {/* Endereço */}
          <div className="sm:col-span-2">
            <label className={lbl}>Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, Av..." className={inp} />
          </div>
          {/* Número */}
          <div>
            <label className={lbl}>Número</label>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº" className={inp} />
          </div>
          {/* Complemento */}
          <div className="sm:col-span-2">
            <label className={lbl}>Complemento</label>
            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." className={inp} />
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">
          Contato
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={lbl}>WhatsApp</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(85) 99999-9999" className={inp} />
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
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">
          Observações
        </h2>
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
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end pb-8">
        <a
          href="/clientes"
          className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
        >
          Cancelar
        </a>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "💾 Salvar cliente"}
        </button>
      </div>
    </div>
  );
}
