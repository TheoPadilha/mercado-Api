
-- Table: public.categorias
CREATE TABLE IF NOT EXISTS public.categorias
(
    id integer NOT NULL DEFAULT nextval('categorias_id_seq'::regclass),
    nome text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT categorias_pkey PRIMARY KEY (id),
    CONSTRAINT categorias_nome_key UNIQUE (nome)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.categorias
    OWNER to postgres;




-- Table: public.clientes
CREATE TABLE IF NOT EXISTS public.clientes
(
    id integer NOT NULL DEFAULT nextval('clientes_id_seq'::regclass),
    nome text COLLATE pg_catalog."default" NOT NULL,
    cpf text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT clientes_pkey PRIMARY KEY (id),
    CONSTRAINT clientes_cpf_key UNIQUE (cpf)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.clientes
    OWNER to postgres;




-- Table: public.compra
CREATE TABLE IF NOT EXISTS public.compra
(
    id integer NOT NULL DEFAULT nextval('compra_id_seq'::regclass),
    compra_date timestamp without time zone NOT NULL,
    cliente_id integer NOT NULL,
    CONSTRAINT compra_pkey PRIMARY KEY (id),
    CONSTRAINT fk_usuario FOREIGN KEY (cliente_id)
        REFERENCES public.clientes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.compra
    OWNER to postgres;





-- Table: public.produtocompra
CREATE TABLE IF NOT EXISTS public.produtocompra
(
    produto_id integer NOT NULL,
    quantidade integer NOT NULL,
    cliente_id integer NOT NULL,
    compra_id integer NOT NULL DEFAULT nextval('produtocompra_compra_id_temp_seq'::regclass),
    categoria_id integer,
    preco numeric(10,2),
    CONSTRAINT produtocompra_pkey PRIMARY KEY (produto_id, cliente_id, compra_id),
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id)
        REFERENCES public.categorias (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_cliente FOREIGN KEY (cliente_id)
        REFERENCES public.clientes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_produto FOREIGN KEY (produto_id)
        REFERENCES public.produtos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.produtocompra
    OWNER to postgres;



-- Table: public.produtos
CREATE TABLE IF NOT EXISTS public.produtos
(
    id integer NOT NULL DEFAULT nextval('produtos_id_seq'::regclass),
    nome text COLLATE pg_catalog."default" NOT NULL,
    quantidade integer NOT NULL,
    categoria_id integer,
    preco numeric(10,2) NOT NULL,
    ativo boolean DEFAULT true,
    CONSTRAINT produtos_pkey PRIMARY KEY (id),
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id)
        REFERENCES public.categorias (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.produtos
    OWNER to postgres;