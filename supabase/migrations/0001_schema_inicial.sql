-- ============================================================
-- ERP EMILY PLUS SIZE - Schema inicial do banco de dados
-- Data: 2026-05-24
-- ============================================================
-- Este arquivo cria todas as tabelas necessárias para a Fase 1
-- do ERP: produtos, estoque, vendas, atendentes, fornecedores.
-- ============================================================


-- ============================================================
-- 1. CATEGORIAS DE PRODUTOS
-- Ex: Vestidos, Blusas, Calças
-- ============================================================
CREATE TABLE categorias (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 2. FORNECEDORES
-- De onde vêm os produtos
-- ============================================================
CREATE TABLE fornecedores (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. PRODUTOS (modelo "pai")
-- Ex: "Vestido Midi Floral" — sem tamanho/cor específicos
-- ============================================================
CREATE TABLE produtos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id BIGINT REFERENCES categorias(id),
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. VARIAÇÕES
-- Cada combinação tamanho + cor de um produto.
-- Ex: "Vestido Midi Floral" tamanho 46, cor Azul.
-- Aqui mora o ESTOQUE de verdade.
-- ============================================================
CREATE TABLE variacoes (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tamanho TEXT,
  cor TEXT,
  codigo_barras TEXT UNIQUE,
  preco_custo NUMERIC(10, 2) DEFAULT 0,
  preco_venda NUMERIC(10, 2) NOT NULL,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. PERFIS DOS USUÁRIOS (atendentes)
-- Estende a tabela auth.users do Supabase
-- ============================================================
CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'atendente' CHECK (papel IN ('dono', 'gerente', 'atendente')),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 6. VENDAS (cabeçalho)
-- Uma linha por venda no PDV
-- ============================================================
CREATE TABLE vendas (
  id BIGSERIAL PRIMARY KEY,
  numero_venda BIGSERIAL,
  atendente_id UUID REFERENCES auth.users(id),
  cliente_nome TEXT,
  cliente_telefone TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'credito', 'debito', 'misto')),
  status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('concluida', 'cancelada', 'pendente')),
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. ITENS DAS VENDAS
-- O que foi vendido em cada venda
-- ============================================================
CREATE TABLE venda_itens (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  variacao_id BIGINT NOT NULL REFERENCES variacoes(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);


-- ============================================================
-- 8. MOVIMENTAÇÕES DE ESTOQUE
-- Histórico de TODA entrada e saída de produtos.
-- Importante pra auditoria ("o que aconteceu com essa peça?")
-- ============================================================
CREATE TABLE movimentacoes_estoque (
  id BIGSERIAL PRIMARY KEY,
  variacao_id BIGINT NOT NULL REFERENCES variacoes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda', 'devolucao')),
  quantidade INTEGER NOT NULL,
  estoque_antes INTEGER NOT NULL,
  estoque_depois INTEGER NOT NULL,
  motivo TEXT,
  venda_id BIGINT REFERENCES vendas(id),
  usuario_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ÍNDICES (deixa o sistema mais rápido nas buscas)
-- ============================================================
CREATE INDEX idx_variacoes_produto ON variacoes(produto_id);
CREATE INDEX idx_variacoes_codigo_barras ON variacoes(codigo_barras);
CREATE INDEX idx_venda_itens_venda ON venda_itens(venda_id);
CREATE INDEX idx_vendas_atendente ON vendas(atendente_id);
CREATE INDEX idx_vendas_data ON vendas(criado_em DESC);
CREATE INDEX idx_movimentacoes_variacao ON movimentacoes_estoque(variacao_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(criado_em DESC);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_fornecedor ON produtos(fornecedor_id);


-- ============================================================
-- SEGURANÇA — Row Level Security (RLS)
-- Liga a "trava" do banco. Só usuários logados podem acessar.
-- Vamos refinar as políticas conforme construímos as telas.
-- ============================================================
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;


-- Política inicial: qualquer usuário logado pode tudo
-- (Vamos restringir conforme o papel na Tarefa #3)
CREATE POLICY "logado_pode_tudo" ON categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON variacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON perfis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON vendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON venda_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logado_pode_tudo" ON movimentacoes_estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- DADOS INICIAIS — Categorias comuns em loja plus size
-- ============================================================
INSERT INTO categorias (nome, descricao) VALUES
  ('Vestidos', 'Vestidos casuais, festa, midi, longo'),
  ('Blusas', 'Blusas, camisetas, regatas, croppeds'),
  ('Calças', 'Calças jeans, leggings, sociais, alfaiataria'),
  ('Saias', 'Saias midi, longa, jeans, plissadas'),
  ('Conjuntos', 'Conjuntos de duas ou mais peças'),
  ('Macacões', 'Macacões e jardineiras'),
  ('Lingerie', 'Sutiãs, calcinhas, conjuntos íntimos'),
  ('Moda Praia', 'Biquínis, maiôs, saídas de praia'),
  ('Acessórios', 'Cintos, bijuterias, bolsas, lenços'),
  ('Casacos', 'Jaquetas, blazers, cardigãs');


-- ============================================================
-- FIM DO SCHEMA INICIAL
-- ============================================================
