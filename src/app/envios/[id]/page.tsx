import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

const SERVICOS: Record<string, string> = {
  pac: "PAC", sedex: "SEDEX", sedex10: "SEDEX 10",
  pac_mini: "PAC Mini Envios", sedex_mini: "SEDEX Mini Envios",
  carta_reg: "Carta Registrada", motoboy: "Motoboy", retirada: "Retirada na loja",
};

export default async function EtiquetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedidoId = parseInt(id);
  if (isNaN(pedidoId)) notFound();

  const supabase = await createClient();
  const { data: pedido } = await supabase
    .from("pedidos_venda")
    .select("id, cliente_nome, endereco_entrega, codigo_rastreamento, servico_envio, total, criado_em")
    .eq("id", pedidoId)
    .single();

  if (!pedido) notFound();

  const { data: itens } = await supabase
    .from("pedido_venda_itens")
    .select("produto_nome, variacao_descricao, quantidade")
    .eq("pedido_id", pedidoId);

  const servicoLabel = pedido.servico_envio ? (SERVICOS[pedido.servico_envio] ?? pedido.servico_envio) : "—";
  const dataFormatada = new Date(pedido.criado_em).toLocaleDateString("pt-BR");

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <title>Etiqueta #{pedido.id}</title>
        <style>{`
          @page { size: 10cm 15cm; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
          body { background: white; }
          .etiqueta { width: 10cm; min-height: 15cm; padding: 0.5cm; border: 2px solid #000; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 0.3cm; margin-bottom: 0.3cm; }
          .logo { font-size: 14pt; font-weight: bold; line-height: 1.2; }
          .logo span { font-size: 8pt; display: block; font-weight: normal; color: #555; }
          .servico { border: 2px solid #000; padding: 3px 8px; font-size: 11pt; font-weight: bold; text-transform: uppercase; }
          .secao { margin-bottom: 0.3cm; }
          .secao-titulo { font-size: 7pt; text-transform: uppercase; color: #777; font-weight: bold; margin-bottom: 2px; }
          .secao-valor { font-size: 10pt; font-weight: bold; line-height: 1.3; }
          .rastreamento { border: 2px dashed #000; padding: 0.2cm; text-align: center; margin: 0.3cm 0; }
          .rastreamento .codigo { font-size: 14pt; font-weight: bold; letter-spacing: 2px; font-family: monospace; }
          .rastreamento .label { font-size: 7pt; color: #777; text-transform: uppercase; }
          .divisor { border-top: 1px dashed #ccc; margin: 0.2cm 0; }
          .itens { font-size: 7.5pt; color: #444; }
          .rodape { border-top: 1px solid #ccc; padding-top: 0.2cm; margin-top: 0.3cm; font-size: 7pt; color: #777; display: flex; justify-content: space-between; }
          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        {/* Botão imprimir — só aparece na tela */}
        <div className="no-print" style={{ padding: "16px", background: "#fef3c7", display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={() => window.print()} style={{ padding: "8px 20px", background: "#d97706", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
            🖨️ Imprimir etiqueta
          </button>
          <span style={{ fontSize: "13px", color: "#92400e" }}>Pedido #{pedido.id} • {pedido.cliente_nome}</span>
        </div>

        <div className="etiqueta">
          {/* Cabeçalho */}
          <div className="header">
            <div className="logo">
              Emily Plus Size
              <span>Remetente</span>
            </div>
            <div className="servico">{servicoLabel}</div>
          </div>

          {/* Destinatário */}
          <div className="secao">
            <div className="secao-titulo">Destinatário</div>
            <div className="secao-valor">{pedido.cliente_nome}</div>
            {pedido.endereco_entrega && (
              <div style={{ fontSize: "9pt", marginTop: "3px", lineHeight: "1.4" }}>{pedido.endereco_entrega}</div>
            )}
          </div>

          {/* Código de rastreamento */}
          {pedido.codigo_rastreamento ? (
            <div className="rastreamento">
              <div className="label">Código de rastreamento</div>
              <div className="codigo">{pedido.codigo_rastreamento}</div>
            </div>
          ) : (
            <div className="rastreamento">
              <div className="label">Código de rastreamento</div>
              <div style={{ fontSize: "9pt", color: "#aaa", marginTop: "4px" }}>Não informado</div>
            </div>
          )}

          {/* Itens */}
          {itens && itens.length > 0 && (
            <>
              <div className="divisor" />
              <div className="secao-titulo" style={{ marginBottom: "4px" }}>Conteúdo</div>
              <div className="itens">
                {itens.map((item, i) => (
                  <div key={i}>{item.quantidade}x {item.produto_nome} {item.variacao_descricao ? `(${item.variacao_descricao})` : ""}</div>
                ))}
              </div>
            </>
          )}

          {/* Rodapé */}
          <div className="rodape">
            <span>Pedido #{pedido.id} • {dataFormatada}</span>
            <span>Total: R$ {pedido.total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </body>
    </html>
  );
}
