"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarFornecedor } from "./actions";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const inp = "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

export function FornecedorForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState("juridica");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [ie, setIe] = useState("");
  const [contato, setContato] = useState("");
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [celular, setCelular] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  async function buscarCep(valor: string) {
    const d = valor.replace(/\D/g, "");
    if (d.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (!data.erro) { setEndereco(data.logradouro ?? ""); setBairro(data.bairro ?? ""); setCidade(data.localidade ?? ""); setUf(data.uf ?? ""); }
    } catch { /* ignora */ }
    setBuscandoCep(false);
  }

  function handleSalvar() {
    if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
    setErro("");
    startTransition(async () => {
      const r = await criarFornecedor({
        nome: nome.trim(), fantasia: fantasia.trim() || null, tipo_pessoa: tipoPessoa,
        cnpj: cnpj.trim() || null, cpf: cpf.trim() || null, ie: ie.trim() || null,
        contato: contato.trim() || null, cep: cep.trim() || null, uf: uf || null,
        cidade: cidade.trim() || null, bairro: bairro.trim() || null,
        endereco: endereco.trim() || null, numero: numero.trim() || null,
        complemento: complemento.trim() || null, whatsapp: whatsapp.trim() || null,
        celular: celular.trim() || null, telefone: telefone.trim() || null,
        email: email.trim() || null, site: site.trim() || null,
        observacoes: observacoes.trim() || null,
      });
      if (!r.sucesso) setErro(r.erro);
      else router.push("/fornecedores");
    });
  }

  return (
    <div className="space-y-5">
      {/* Dados cadastrais */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados cadastrais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={lbl}>Nome / Razão social <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da empresa ou fornecedor" className={inp} />
          </div>
          <div>
            <label className={lbl}>Tipo de pessoa</label>
            <select value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value)} className={inp}>
              <option value="juridica">Pessoa Jurídica</option>
              <option value="fisica">Pessoa Física</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Fantasia / Apelido</label>
            <input value={fantasia} onChange={(e) => setFantasia(e.target.value)} placeholder="Nome fantasia" className={inp} />
          </div>
          <div>
            <label className={lbl}>Contato principal</label>
            <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Nome do representante" className={inp} />
          </div>
          <div>
            <label className={lbl}>CNPJ</label>
            <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={inp} />
          </div>
          <div>
            <label className={lbl}>CPF</label>
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className={inp} />
          </div>
          <div>
            <label className={lbl}>Insc. Estadual</label>
            <input value={ie} onChange={(e) => setIe(e.target.value)} placeholder="Opcional" className={inp} />
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Endereço</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className={lbl}>CEP</label>
            <div className="flex gap-1.5">
              <input value={cep} onChange={(e) => setCep(e.target.value)} onBlur={(e) => buscarCep(e.target.value)} placeholder="00000-000" maxLength={9} className={inp} />
              <button type="button" onClick={() => buscarCep(cep)} disabled={buscandoCep} className="shrink-0 px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition disabled:opacity-50">{buscandoCep ? "..." : "🔍"}</button>
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
            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Sala, galpão..." className={inp} />
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Contato</h2>
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
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(85) 3333-3333" className={inp} />
          </div>
          <div>
            <label className={lbl}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@fornecedor.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Site</label>
            <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="www.fornecedor.com.br" className={inp} />
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Observações</h2>
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Condições de pagamento, prazo de entrega, observações gerais..." className={inp + " resize-none"} />
      </section>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      <div className="flex gap-3 justify-end pb-8">
        <a href="/fornecedores" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending} className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Salvar fornecedor"}
        </button>
      </div>
    </div>
  );
}
