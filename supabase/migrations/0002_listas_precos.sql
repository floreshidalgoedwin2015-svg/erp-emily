-- Listas de preço independentes (ATACADO, DISTRIBUIDOR, Black Friday, etc.)
CREATE TABLE IF NOT EXISTS listas_precos (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Itens de cada lista: produto + preço especial
CREATE TABLE IF NOT EXISTS lista_preco_itens (
  id          BIGSERIAL PRIMARY KEY,
  lista_id    BIGINT NOT NULL REFERENCES listas_precos(id) ON DELETE CASCADE,
  produto_id  BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco       NUMERIC(10, 2) NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lista_id, produto_id)
);

-- RLS
ALTER TABLE listas_precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_listas_precos"
  ON listas_precos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE lista_preco_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lista_preco_itens"
  ON lista_preco_itens FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
