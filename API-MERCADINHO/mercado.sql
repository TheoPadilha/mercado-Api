-- Tabela de Categorias
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE
);

-- Tabela de Compras
CREATE TABLE compra (
    id SERIAL PRIMARY KEY,
    compra_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    cliente_id INTEGER NOT NULL,
    CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabela de Produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Tabela Produtocompra (Tabela de Junção entre Produtos, Clientes e Compras)
CREATE TABLE produtocompra (
    produto_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    compra_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (produto_id, cliente_id, compra_id),  -- Chave primária composta
    CONSTRAINT fk_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_compra FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE
);

select * from categorias
select * from clientes
select * from compra
select * from produtocompra
select * from produtos 
