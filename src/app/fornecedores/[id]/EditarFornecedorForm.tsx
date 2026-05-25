"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarFornecedor } from "./actions";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type FornecedorDb = {
  id: number; nome: string; fantasia: string | null; tipo_pessoa: string | null;
  cnpj: string | null; cpf: string | null; ie: string | null; contato: string | null;
  cep: string | null; uf: string | null; cidade: string | null; bairro: string | null;
  endereco: string | null; numero: string | null; complemento: string | null;
  whatsapp: string | null; celular: string | null; telefone: string | null;
  email: string | null; site: string | null; observacoes: string | null;
};

type PedidoResumo = { id: number; status: string; total: number; criado_em: string };

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-zinc-100 text-zinc-600",
  enviado: "bg-blue-100 text-blue-700",
  recebido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-500",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", recebido: "Recebido", cancelado: "Cancelado",
};

const inp = "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white";
const lbl = "block text-xs font-medium text-zinc-600 mb-1";

function fmt(n: number) { return "R$ " + n.toFixed(2).replace(".", ","); }

export function EditarFornecedorForm({ fornecedor, pedidos }: { fornecedor: FornecedorDb; pedidos: PedidoResumo[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState(fornecedor.nome);
  const [fantasia, setFantasia] = useState(fornecedor.fantasia ?? "");
  const [tipoPessoa, setTipoPessoa] = useState(fornecedor.tipo_pessoa ?? "juridica");
  const [cnpj, setCnpj] = useState(fornecedor.cnpj ?? "");
  const [cpf, setCpf] = useState(fornecedor.cpf ?? "");
  const [ie, setIe] = useState(fornecedor.ie ?? "");
  const [contato, setContato] = useState(fornecedor.contato ?? "");
  const [cep, setCep] = useState(fornecedor.cep ?? "");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [uf, setUf] = useState(fornecedor.uf ?? "");
  const [cidade, setCidade] = useState(fornecedor.cidade ?? "");
  const [bairro, setBairro] = useState(fornecedor.bairro ?? "");
  const [endereco, setEndereco] = useState(fornecedor.endereco ?? "");
  const [numero, setNumero] = useState(fornecedor.numero ?? "");
  const [complemento, setComplemento] = useState(fornecedor.complemento ?? "");
  const [whatsapp, setWhatsapp] = useState(fornecedor.whatsapp ?? "");
  const [celular, setCelular] = useState(fornecedor.celular ?? "");
  const [telefone, setTelefone] = useState(fornecedor.telefone ?? "");
  const [email, setEmail] = useState(fornecedor.email ?? "");
  const [site, setSite] = useState(fornecedor.site ?? "");
  const [observacoes, setObservacoes] = useState(fornecedor.observacoes ?? "");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

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
      const r = await atualizarFornecedor(fornecedor.id, {
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
      if (r.sucesso) { setSucesso(true); setTimeout(() => router.push("/fornecedores"), 1200); }
      else setErro(r.erro);
    });
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-12 shadow-sm text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-zinc-800">Fornecedor salvo!</h2>
        <p className="text-sm text-zinc-500 mt-2">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Dados cadastrais */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Dados cadastrais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={lbl}>Nome / Razão social <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da empresa" className={inp} />
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
          <div><label className={lbl}>CNPJ</label><input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={inp} /></div>
          <div><label className={lbl}>CPF</label><input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className={inp} /></div>
          <div><label className={lbl}>Insc. Estadual</label><input value={ie} onChange={(e) => setIe(e.target.value)} placeholder="Opcional" className={inp} /></div>
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
          <div><label className={lbl}>UF</label><select value={uf} onChange={(e) => setUf(e.target.value)} className={inp}><option value="">UF</option>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
          <div className="sm:col-span-2"><label className={lbl}>Cidade</label><input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inp} /></div>
          <div><label className={lbl}>Bairro</label><input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Endereço</label><input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, Av..." className={inp} /></div>
          <div><label className={lbl}>Número</label><input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº" className={inp} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Complemento</label><input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Sala, galpão..." className={inp} /></div>
        </div>
      </section>

      {/* Contato */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Contato</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><label className={lbl}>WhatsApp</label><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(85) 99999-9999" className={inp} /></div>
          <div><label className={lbl}>Celular</label><input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="(85) 99999-9999" className={inp} /></div>
          <div><label className={lbl}>Fone</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(85) 3333-3333" className={inp} /></div>
          <div><label className={lbl}>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@fornecedor.com" className={inp} /></div>
          <div><label className={lbl}>Site</label><input value={site} onChange={(e) => setSite(e.target.value)} placeholder="www.fornecedor.com.br" className={inp} /></div>
        </div>
      </section>

      {/* Observações */}
      <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide mb-4">Observações</h2>
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Condições de pagamento, prazo de entrega..." className={inp + " resize-none"} />
      </section>

      {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {erro}</div>}

      <div className="flex gap-3 justify-end">
        <a href="/fornecedores" className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">Cancelar</a>
        <button type="button" onClick={handleSalvar} disabled={isPending} className="px-6 py-2.5 rounded-xl bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60">
          {isPending ? "Salvando..." : "💾 Salvar alterações"}
        </button>
      </div>

      {/* Pedidos de compra deste fornecedor */}
      {pedidos.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800">🛍️ Pedidos de compra</h2>
            <span className="text-xs text-zinc-500">{pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-amber-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pedido</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Data</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-amber-50">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3"><a href={`/compras/${p.id}`} className="font-mono font-semibold text-amber-700 hover:underline">#{p.id}</a></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-zinc-500 text-xs">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">{fmt(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
