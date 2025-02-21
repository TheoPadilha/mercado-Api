-- Habilita a função gen_random_uuid() (se necessário)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY, -- ID numérico e autoincrementável
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL, -- Categoria como texto
    preco_in_cents INTEGER NOT NULL,
    quantidade INTEGER NOT NULL
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY, -- ID numérico e autoincrementável
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE -- CPF único
);

-- Tabela de Compras
CREATE TABLE IF NOT EXISTS public.compra (
    id SERIAL PRIMARY KEY, -- ID numérico e autoincrementável
    compra_date DATE NOT NULL,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES clientes(id)
);

-- Tabela de Produtos por Compra
CREATE TABLE IF NOT EXISTS public.produtocompra (
    id SERIAL PRIMARY KEY, -- ID numérico e autoincrementável
    compra_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    CONSTRAINT fk_compra
        FOREIGN KEY (compra_id)
        REFERENCES compra(id),
    CONSTRAINT fk_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
);
-- CREATE TABLE IF NOT EXISTS public.estoque (
--     id id SERIAL PRIMARY KEY,
--     produto_id UUID NOT NULL,
--     quantidade INTEGER NOT NULL,
--     data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     tipo_modificacao TEXT NOT NULL CHECK (tipo_modificacao IN ('entrada', 'saida')),
--     CONSTRAINT fk_produto
--         FOREIGN KEY (produto_id)
--         REFERENCES produtos(id)
-- );