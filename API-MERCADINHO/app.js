import express from "express";
import Joi from "joi";
import { validarCPF } from "./functions.js";
import "dotenv/config";
import pool from "./db.js"; // Importa a conexão com o banco de dados
import cors from "cors";
const app = express();

app.use(express.json()); // Middleware para permitir o uso de JSON nas requisições
app.use(cors());
// GET => Lista todos os produtos do mercado
app.get("/mercado", async (req, res) => {
  try {
    // Consulta para obter todas as categorias com seus produtos ativos
    const result = await pool.query(
      `SELECT 
        p.nome, 
        p.quantidade, 
        p.preco AS preço, 
        LOWER(c.nome) AS categoria 
      FROM categorias c
      LEFT JOIN produtos p ON p.categoria_id = c.id AND p.ativo = TRUE` // LEFT JOIN para garantir que todas as categorias apareçam
    );

    // Organiza os produtos por categoria
    const produtosPorCategoria = result.rows.reduce((acc, produto) => {
      const { categoria, nome, quantidade, preço } = produto;

      // Se a categoria ainda não existir no acumulador, criamos uma nova lista
      if (!acc[categoria]) {
        acc[categoria] = [];
      }

      // Adiciona o produto à categoria correspondente
      if (nome) {
        // Verifica se o produto existe
        acc[categoria].push({
          nome,
          quantidade,
          preçoR$: Number(preço),
        });
      }

      return acc;
    }, {});

    // Retorna a lista de produtos organizados por categoria
    res.status(200).json(produtosPorCategoria);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).json({ mensagem: "Erro ao buscar produtos." });
  }
});
// GET => Lista todas as categorias disponíveis
app.get("/mercado/categoria", async (req, res) => {
  try {
    const result = await pool.query("SELECT nome FROM categorias");

    if (result.rows.length === 0) {
      return res.status(200).json({
        mensagem:
          "Não há categorias cadastradas no momento. Por favor, crie uma categoria antes de buscar produtos.",
      });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao buscar categorias." });
  }
});

// GET => Lista os produtos de uma categoria específica
app.get("/mercado/categoria/:categoria", async (req, res) => {
  const { categoria } = req.params;

  try {
    // Verifica se a categoria existe e obtém seu ID
    const categoriaResult = await pool.query(
      "SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)",
      [categoria]
    );

    if (categoriaResult.rows.length === 0) {
      return res.status(400).json({
        mensagem: `A categoria '${categoria}' não existe. Por favor, crie a categoria antes de buscar produtos.`,
      });
    }

    const categoriaId = categoriaResult.rows[0].id;

    // Busca produtos ativos que pertencem à categoria encontrada
    const produtosResult = await pool.query(
      `SELECT p.nome, p.quantidade, p.preco AS preço 
       FROM produtos p 
       WHERE p.categoria_id = $1 AND p.ativo = TRUE`,
      [categoriaId]
    );

    if (produtosResult.rows.length === 0) {
      return res.status(404).json({
        mensagem: `Nenhum produto ativo encontrado para a categoria '${categoria}'.`,
      });
    }

    // Formata os produtos corretamente garantindo que o preço seja um número
    const produtosFormatados = produtosResult.rows.map((produto) => ({
      nome: produto.nome,
      quantidade: produto.quantidade,
      preçoR$: Number(produto.preço),
    }));

    res.status(200).json(produtosFormatados);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).json({ mensagem: "Erro ao buscar produtos." });
  }
});

// GET => Busca um produto específico pelo nome
app.get("/mercado/:nome", async (req, res) => {
  const { nome } = req.params;

  try {
    // Busca o produto pelo nome, incluindo a categoria
    const result = await pool.query(
      `SELECT p.nome, p.quantidade, p.preco AS preço, LOWER(c.nome) AS categoria 
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE LOWER(p.nome) = LOWER($1) AND p.ativo = TRUE`,
      [nome]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ mensagem: "Produto não encontrado ou inativo." });
    }

    // Formata o resultado garantindo que o preço seja um número
    const produto = {
      nome: result.rows[0].nome,
      quantidade: result.rows[0].quantidade,
      preçoR$: Number(result.rows[0].preço),
      categoria: result.rows[0].categoria,
    };

    res.status(200).json(produto);
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    res.status(500).json({ mensagem: "Erro ao buscar produto." });
  }
});

// POST => Adiciona um novo produto ao mercado
app.post("/mercado", async (req, res) => {
  const schemaProduto = Joi.object({
    nome: Joi.string().min(3).max(50).required(),
    categoria: Joi.string().min(3).max(50).required(),
    preco: Joi.number().min(0).required(),
    quantidade: Joi.number().min(0).required(),
  });

  // Validação dos dados enviados na requisição
  const { error } = schemaProduto.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ message: "Dados inválidos", errors: error.details });
  }

  let { nome, categoria, preco, quantidade } = req.body;

  try {
    // Verifica se a categoria existe
    const result = await pool.query(
      "SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)",
      [categoria]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: `A categoria '${categoria}' não existe. Por favor, crie a categoria antes de adicionar produtos.`,
      });
    }

    const categoria_id = result.rows[0].id;

    // Verifica se o produto já existe
    const produtoExistente = await pool.query(
      "SELECT id, ativo FROM produtos WHERE LOWER(nome) = LOWER($1)",
      [nome]
    );

    if (produtoExistente.rows.length > 0) {
      const produto = produtoExistente.rows[0];

      if (!produto.ativo) {
        // Se o produto existe, mas está desativado, apenas reativa ele
        await pool.query(
          "UPDATE produtos SET ativo = TRUE, quantidade = $1, preco = $2, categoria_id = $3 WHERE id = $4",
          [quantidade, preco, categoria_id, produto.id]
        );

        return res.status(200).json({
          message: `Produto '${nome}' reativado com sucesso!`,
          produto: { nome, quantidade, preco, categoria },
        });
      }

      return res
        .status(400)
        .json({ message: `O produto '${nome}' já existe no mercado.` });
    }

    // Se o produto não existir, insere um novo
    await pool.query(
      "INSERT INTO produtos (nome, categoria_id, preco, quantidade, ativo) VALUES ($1, $2, $3, $4, TRUE)",
      [nome.toLowerCase(), categoria_id, preco, quantidade]
    );

    res.status(201).json({
      message: `Produto '${nome}' criado com sucesso e adicionado à categoria '${categoria}'.`,
      produto: { nome, quantidade, preco, categoria },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar produto." });
  }
});

// POST => Cria uma nova categoria de produtos
app.post("/mercado/categoria", async (req, res) => {
  const schemaCategoria = Joi.object({
    nome: Joi.string().min(3).max(50).required(),
  });

  // Validação dos dados enviados na requisição
  const { error } = schemaCategoria.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ message: "Dados inválidos", errors: error.details });
  }

  // Converte o nome da categoria para minúsculas
  const nome = req.body.nome.toLowerCase();

  try {
    // Verifica se a categoria já existe (insensível a maiúsculas e minúsculas)
    const result = await pool.query(
      "SELECT id FROM categorias WHERE LOWER(nome) = $1",
      [nome]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({
        message: `A categoria '${nome}' já existe.`,
      });
    }

    // Insere a nova categoria no banco de dados (sempre em minúsculas)
    await pool.query("INSERT INTO categorias (nome) VALUES ($1)", [nome]);

    res.status(201).json({
      nome,
      message: `Categoria '${nome}' criada com sucesso!`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar categoria." });
  }
});

// PUT => Atualiza um produto existente
app.put("/mercado/:nome", async (req, res) => {
  const schemaProdutoUpdate = Joi.object({
    nome: Joi.string().min(3).max(50),
    categoria: Joi.string().min(3).max(50), // Nome da categoria
    preco: Joi.number().min(0), // Agora usamos `preco` em vez de `preco_in_cents`
    quantidade: Joi.number().min(0),
  }).min(1);

  const { error } = schemaProdutoUpdate.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res
      .status(400)
      .json({ message: "Dados inválidos", errors: error.details });
  }

  const { nome } = req.params;

  try {
    // Verificar se o produto existe
    const produtoResult = await pool.query(
      "SELECT id, nome, categoria_id, preco, quantidade FROM produtos WHERE nome = $1",
      [nome]
    );

    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produto = produtoResult.rows[0];
    const produtoId = produto.id;
    const { nome: novoNome, categoria, preco, quantidade } = req.body;

    // Verificar se o novo nome já existe em outro produto
    if (novoNome) {
      const nomeExistente = await pool.query(
        "SELECT id FROM produtos WHERE nome = $1 AND id <> $2",
        [novoNome, produtoId]
      );

      if (nomeExistente.rows.length > 0) {
        return res.status(400).json({
          message: `Já existe um produto com o nome '${novoNome}'. Escolha outro nome.`,
        });
      }
    }

    let categoriaId = produto.categoria_id;
    let nomeCategoria = "";

    if (categoria) {
      // Buscar o id da categoria pelo nome
      const categoriaResult = await pool.query(
        "SELECT id, nome FROM categorias WHERE nome = $1",
        [categoria]
      );

      if (categoriaResult.rows.length === 0) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      categoriaId = categoriaResult.rows[0].id;
      nomeCategoria = categoriaResult.rows[0].nome; // Captura o nome da categoria
    }

    const campos = [];
    const valores = [];
    let indice = 1;

    if (novoNome) {
      campos.push(`nome = $${indice++}`);
      valores.push(novoNome);
    }
    if (preco !== undefined) {
      campos.push(`preco = $${indice++}`);
      valores.push(preco);
    }
    if (quantidade !== undefined) {
      campos.push(`quantidade = $${indice++}`);
      valores.push(quantidade);
    }
    if (categoriaId !== null) {
      campos.push(`categoria_id = $${indice++}`);
      valores.push(categoriaId);
    }

    valores.push(produtoId);

    const query = `UPDATE produtos SET ${campos.join(
      ", "
    )} WHERE id = $${indice}`;

    // Armazena os dados anteriores antes da atualização
    const dadosAntes = {
      nome: produto.nome,
      categoria: nomeCategoria, // Nome da categoria anterior
      precoR$: Number(produto.preco), // Agora usamos `preco` diretamente
      quantidade: produto.quantidade,
    };

    await pool.query(query, valores);

    // Busca novamente os dados atualizados
    const { rows: produtoAtualizado } = await pool.query(
      "SELECT nome, categoria_id, preco, quantidade FROM produtos WHERE id = $1",
      [produtoId]
    );

    const produtoAtualizadoInfo = produtoAtualizado[0];

    // Busca o nome da categoria atualizada
    const categoriaAtualizadaResult = await pool.query(
      "SELECT nome FROM categorias WHERE id = $1",
      [produtoAtualizadoInfo.categoria_id]
    );
    const nomeCategoriaAtualizado = categoriaAtualizadaResult.rows[0]
      ? categoriaAtualizadaResult.rows[0].nome
      : "Categoria não encontrada";

    res.status(200).json({
      message: "Produto atualizado com sucesso",
      dados_anteriores: dadosAntes,
      dados_atuais: {
        nome: produtoAtualizadoInfo.nome,
        categoria: nomeCategoriaAtualizado, // Nome da categoria atualizada
        precoR$: Number(produtoAtualizadoInfo.preco),
        quantidade: produtoAtualizadoInfo.quantidade,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar produto" });
  }
});

// Atualiza o nome de uma categoria
app.put("/mercado/categoria/:categoria", async (req, res) => {
  let { categoria } = req.params;
  let { novaCategoria } = req.body;

  // Verificar se 'novaCategoria' é uma string
  if (typeof novaCategoria !== "string") {
    return res
      .status(400)
      .json({ mensagem: "O novo nome da categoria deve ser uma string." });
  }

  // Converte para minúsculas
  categoria = categoria.toLowerCase();
  novaCategoria = novaCategoria.toLowerCase();

  // Verifica se o novo nome da categoria foi fornecido
  if (!novaCategoria) {
    return res
      .status(400)
      .json({ mensagem: "Nome da nova categoria é obrigatório" });
  }

  try {
    // Verifica se a categoria que será atualizada existe
    const categoriaResult = await pool.query(
      "SELECT id FROM categorias WHERE nome = $1",
      [categoria]
    );

    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    const categoriaId = categoriaResult.rows[0].id;

    // Verifica se a nova categoria já existe
    const novaCategoriaResult = await pool.query(
      "SELECT id FROM categorias WHERE nome = $1",
      [novaCategoria]
    );

    if (novaCategoriaResult.rows.length > 0) {
      return res.status(400).json({
        mensagem: `A categoria '${novaCategoria}' já existe. Escolha outro nome.`,
      });
    }

    // Atualiza o nome da categoria
    await pool.query("UPDATE categorias SET nome = $1 WHERE id = $2", [
      novaCategoria,
      categoriaId,
    ]);

    // Atualiza a categoria dos produtos associados
    await pool.query(
      "UPDATE produtos SET categoria_id = $1 WHERE categoria_id = $2",
      [categoriaId, categoriaId]
    );

    res.status(200).json({
      mensagem: "Categoria atualizada com sucesso",
      categoriaAntiga: categoria,
      novaCategoria: novaCategoria,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao atualizar categoria" });
  }
});

// DELETE => Endpoints para deletar produtos e categorias

// Deleta um produto pelo nome
app.delete("/mercado/:nome", async (req, res) => {
  const { nome } = req.params;

  try {
    // Verifica se o produto existe no mercado
    const produtoExistente = await pool.query(
      "SELECT * FROM produtos WHERE LOWER(nome) = LOWER($1)",
      [nome]
    );

    if (produtoExistente.rowCount === 0) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const produtoDeletado = produtoExistente.rows[0];

    // Verifica se o produto foi comprado por algum cliente
    const comprasAssociadas = await pool.query(
      "SELECT * FROM produtocompra WHERE produto_id = $1",
      [produtoDeletado.id]
    );

    if (comprasAssociadas.rowCount > 0) {
      // Apenas desativa o produto, mantendo as compras
      await pool.query(
        "UPDATE produtos SET ativo = FALSE WHERE LOWER(nome) = LOWER($1)",
        [nome]
      );

      return res.status(200).json({
        message:
          "Produto desativado no mercado, mas as compras já feitas não serão afetadas.",
        itemDesativado: { nome: produtoDeletado.nome },
      });
    }

    // Se não houver compras associadas, pode excluir o produto
    await pool.query("DELETE FROM produtos WHERE LOWER(nome) = LOWER($1)", [
      nome,
    ]);

    res.status(200).json({
      message: "Produto deletado com sucesso do mercado.",
      itemDeletado: { nome: produtoDeletado.nome },
    });
  } catch (error) {
    console.error("Erro ao deletar o produto:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

app.delete("/mercado/categoria/:nome", async (req, res) => {
  const { nome } = req.params;

  try {
    // Inicia uma transação
    await pool.query("BEGIN");

    // Verifica se a categoria existe
    const categoriaResult = await pool.query(
      "SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)",
      [nome]
    );

    if (categoriaResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Categoria não encontrada." });
    }

    const categoriaId = categoriaResult.rows[0].id;

    // Deleta os produtos associados à categoria
    await pool.query("DELETE FROM produtos WHERE categoria_id = $1", [
      categoriaId,
    ]);

    // Deleta a categoria
    await pool.query("DELETE FROM categorias WHERE id = $1", [categoriaId]);

    // Confirma a transação
    await pool.query("COMMIT");

    res.status(200).json({
      message: `Categoria '${nome}' e seus produtos associados foram deletados com sucesso.`,
    });
  } catch (error) {
    // Em caso de erro, desfaz a transação
    await pool.query("ROLLBACK");
    console.error("Erro ao deletar a categoria e seus produtos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// PARTE DO CLIENTE

// Criar cliente (POST)
app.post("/clientes", async (req, res) => {
  let { cpf, nome } = req.body;

  // Verifica se o CPF e o nome foram fornecidos
  if (!cpf || !nome) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios." });
  }

  // Remove os pontos e hífens do CPF, caso existam
  cpf = cpf.replace(/[^\d]/g, ""); // Remove qualquer coisa que não seja número

  // Valida o CPF (implemente a função de validação conforme necessário)
  if (!validarCPF(cpf)) {
    return res.status(400).json({ mensagem: "CPF inválido." });
  }

  try {
    // Verifica se já existe um cliente com o mesmo CPF
    const { rowCount } = await pool.query(
      "SELECT 1 FROM clientes WHERE cpf = $1",
      [cpf]
    );
    if (rowCount > 0) {
      return res.status(400).json({ mensagem: "CPF já cadastrado." });
    }

    // Insere o novo cliente na tabela
    const result = await pool.query(
      "INSERT INTO clientes (cpf, nome) VALUES ($1, $2) RETURNING cpf, nome",
      [cpf, nome]
    );

    const novoCliente = result.rows[0];

    // Retorna uma mensagem de sucesso e os detalhes do cliente criado
    res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso!",
      cliente: novoCliente,
    });
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

// Listar todos os clientes (GET)
app.get("/clientes", async (req, res) => {
  try {
    // Consulta para obter os clientes
    const query = `
      SELECT
        c.nome AS cliente_nome,
        c.cpf AS cliente_cpf
      FROM
        clientes c
    `;

    const { rows } = await pool.query(query);

    // Organiza os dados para cada cliente
    const clientes = rows.map((row) => ({
      nome: row.cliente_nome,
      cpf: row.cliente_cpf,
    }));

    // Retorna a lista de clientes com apenas nome e CPF
    res.status(200).json(clientes);
  } catch (err) {
    console.error("Erro ao obter clientes:", err);
    res.status(500).json({ mensagem: "Erro ao obter clientes." });
  }
});

// Buscar cliente por CPF (GET)
app.get("/clientes/:cpf", async (req, res) => {
  const { cpf } = req.params;

  try {
    // Consulta para obter o cliente pelo CPF
    const result = await pool.query(
      "SELECT nome, cpf FROM clientes WHERE cpf = $1",
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    const cliente = result.rows[0];

    // Retorna o nome e o CPF do cliente
    res.status(200).json({
      nome: cliente.nome,
      cpf: cliente.cpf,
    });
  } catch (err) {
    console.error("Erro ao obter cliente:", err);
    res.status(500).json({ mensagem: "Erro ao obter cliente." });
  }
});

// Atualizar cliente (PUT)
app.put("/clientes/:cpf", async (req, res) => {
  let { cpf } = req.params;
  let { nome, novoCpf } = req.body;

  // Remove caracteres não numéricos do CPF
  cpf = cpf.replace(/[^\d]/g, "");
  if (novoCpf) {
    novoCpf = novoCpf.replace(/[^\d]/g, "");
  }

  // Verifica se os campos obrigatórios foram fornecidos
  if (!cpf || !nome || !novoCpf) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios." });
  }

  // Valida CPF atual e novo CPF
  if (!validarCPF(cpf) || !validarCPF(novoCpf)) {
    return res.status(400).json({ mensagem: "CPF inválido." });
  }

  try {
    // Verifica se o cliente existe no banco de dados
    const { rows } = await pool.query(
      "SELECT nome FROM clientes WHERE cpf = $1",
      [cpf]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    const cliente = rows[0];
    const nomeAntigo = cliente.nome;

    // Verifica se o novo nome é igual ao atual
    if (nome === nomeAntigo && cpf === novoCpf) {
      return res.status(400).json({ mensagem: "Nenhuma alteração foi feita." });
    }

    // Verifica se o novo CPF já existe no banco
    // const cpfExistente = await pool.query(
    //   "SELECT cpf FROM clientes WHERE cpf = $1",
    //   [novoCpf]
    // );
    // if (cpfExistente.rows.length > 0) {
    //   return res
    //     .status(400)
    //     .json({ mensagem: "O novo CPF já está cadastrado." });
    // }

    // Atualiza os dados do cliente
    const result = await pool.query(
      "UPDATE clientes SET nome = $1, cpf = $2 WHERE cpf = $3 RETURNING cpf, nome",
      [nome, novoCpf, cpf]
    );

    const clienteAtualizado = result.rows[0];

    res.status(200).json({
      mensagem: "Cliente atualizado com sucesso!",
      cliente: {
        cpfAntigo: cpf,
        cpfNovo: clienteAtualizado.cpf,
        nomeAntigo: nomeAntigo,
        nomeNovo: clienteAtualizado.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

// Excluir cliente (DELETE)
app.delete("/clientes/:cpf", async (req, res) => {
  // Obtém o CPF do cliente a partir dos parâmetros da URL
  const { cpf } = req.params;

  try {
    // Verifica se o cliente existe no banco de dados
    const { rows } = await pool.query(
      "SELECT nome FROM clientes WHERE cpf = $1",
      [cpf]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    const nomeCliente = rows[0].nome;

    // Exclui o cliente do banco de dados
    await pool.query("DELETE FROM clientes WHERE cpf = $1", [cpf]);

    // Retorna uma mensagem de sucesso
    res.status(200).json({
      mensagem: "Cliente removido com sucesso!",
      clienteRemovido: { nome: nomeCliente, cpf: cpf },
    });
  } catch (error) {
    console.error("Erro ao remover cliente:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

// criar uma compra para cada cliente
app.post("/cliente/compra", async (req, res) => {
  const { cpf, produtos } = req.body;

  if (!cpf || !Array.isArray(produtos) || produtos.length === 0) {
    return res
      .status(400)
      .json({ mensagem: "CPF e pelo menos um produto são obrigatórios." });
  }

  try {
    // Busca o cliente no banco de dados pelo CPF
    const { rows: clienteRows } = await pool.query(
      "SELECT id, nome, cpf FROM clientes WHERE cpf = $1",
      [cpf]
    );
    if (clienteRows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }
    const cliente = clienteRows[0];

    // Inicia a transação
    await pool.query("BEGIN");

    let totalCompra = 0;
    let produtosComprados = [];

    // Processa os produtos
    for (const item of produtos) {
      const { nomeProduto, quantidade } = item;

      if (!nomeProduto || isNaN(quantidade) || quantidade <= 0) {
        return res.status(400).json({
          mensagem: "Nome do produto e quantidade válida são obrigatórios.",
        });
      }

      // Busca o produto no banco de dados pelo nome
      const { rows: produtoRows } = await pool.query(
        "SELECT id, nome, preco, categoria_id, quantidade FROM produtos WHERE nome ILIKE $1",
        [nomeProduto]
      );
      if (produtoRows.length === 0) {
        return res
          .status(404)
          .json({ mensagem: `Produto '${nomeProduto}' não encontrado.` });
      }

      const produto = produtoRows[0];

      // Verifica se há estoque suficiente
      if (produto.quantidade < quantidade) {
        return res
          .status(400)
          .json({ mensagem: `Estoque insuficiente para '${nomeProduto}'.` });
      }

      // Busca o nome da categoria
      const { rows: categoriaRows } = await pool.query(
        "SELECT nome FROM categorias WHERE id = $1",
        [produto.categoria_id]
      );
      const categoria =
        categoriaRows.length > 0
          ? categoriaRows[0].nome
          : "Categoria não encontrada";

      // **Cria um novo registro na tabela `compra` para o produto, associando `cliente_id` e `compra_id`**
      const { rows: compraRows } = await pool.query(
        "INSERT INTO compra (cliente_id, compra_date) VALUES ($1, NOW()) RETURNING id",
        [cliente.id]
      );
      const compraId = compraRows[0].id; // Obtém o ID da compra criada para este produto

      // Insere o produto na tabela `produtocompra`, associando `cliente_id`, `compra_id` e outros dados
      await pool.query(
        "INSERT INTO produtocompra (produto_id, quantidade, cliente_id, compra_id, categoria_id, preco) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          produto.id,
          quantidade,
          cliente.id,
          compraId,
          produto.categoria_id,
          produto.preco,
        ]
      );

      // Atualiza o estoque do produto
      await pool.query(
        "UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2",
        [quantidade, produto.id]
      );

      const valorTotal = produto.preco * quantidade;
      totalCompra += valorTotal;

      produtosComprados.push({
        nome: produto.nome,
        categoria: categoria,
        quantidade_comprada: quantidade,
        preco_total: valorTotal.toFixed(2),
        compraId: compraId, // Inclui o compraId exclusivo para o produto
      });
    }

    // Finaliza a transação
    await pool.query("COMMIT");

    res.status(200).json({
      mensagem: "Compra realizada com sucesso!",
      cliente: {
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      totalCompra: totalCompra.toFixed(2),
      produtos: produtosComprados,
    });
  } catch (error) {
    console.error("Erro ao realizar a compra:", error);
    await pool.query("ROLLBACK");
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

app.get("/cliente/compras/:cpf", async (req, res) => {
  const { cpf } = req.params;

  try {
    const { rows: clienteRows } = await pool.query(
      "SELECT id, nome, cpf FROM clientes WHERE cpf = $1",
      [cpf]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    const cliente = clienteRows[0];

    const { rows: comprasRows } = await pool.query(
      `SELECT pc.compra_id AS compra_id, p.nome AS produto, c.nome AS categoria, pc.preco, pc.quantidade
   FROM produtocompra pc
   JOIN produtos p ON pc.produto_id = p.id
   JOIN categorias c ON p.categoria_id = c.id
   WHERE pc.cliente_id = $1`,
      [cliente.id]
    );

    if (comprasRows.length === 0) {
      return res.status(200).json({
        mensagem: "O cliente ainda não realizou nenhuma compra.",
      });
    }

    let totalGasto = 0;
    const comprasAgrupadas = {};

    comprasRows.forEach(
      ({ compra_id, produto, categoria, preco, quantidade }) => {
        if (!comprasAgrupadas[produto]) {
          comprasAgrupadas[produto] = {
            compra_id, // Agora usando o campo 'compra_id'
            nome: produto,
            categoria,
            preçoR$: Number(preco),
            quantidade: 0,
          };
        }
        comprasAgrupadas[produto].quantidade += quantidade;
        totalGasto += Number(preco) * quantidade;
      }
    );

    const comprasFormatadas = Object.values(comprasAgrupadas);

    res.status(200).json({
      mensagem: "Compras do cliente encontradas com sucesso!",
      cliente: {
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      compras: comprasFormatadas,
      totalGasto: Number(totalGasto.toFixed(2)),
    });
  } catch (error) {
    console.error("Erro ao buscar compras do cliente:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

app.get("/cliente/compras", async (req, res) => {
  try {
    const query = `
      SELECT
        c.nome AS cliente_nome,
        c.cpf AS cliente_cpf,
        p.nome AS produto_nome,
        cat.nome AS categoria_nome,
        pc.preco AS preco,
        pc.quantidade AS quantidade
      FROM clientes c
      LEFT JOIN produtocompra pc ON c.id = pc.cliente_id
      LEFT JOIN produtos p ON pc.produto_id = p.id
      LEFT JOIN categorias cat ON p.categoria_id = cat.id
    `;

    const { rows } = await pool.query(query);

    const clientes = {};

    rows.forEach(
      ({
        cliente_nome,
        cliente_cpf,
        produto_nome,
        categoria_nome,
        preco,
        quantidade,
      }) => {
        if (!clientes[cliente_cpf]) {
          clientes[cliente_cpf] = {
            nome: cliente_nome,
            cpf: cliente_cpf,
            compras: {},
          };
        }

        if (produto_nome) {
          if (!clientes[cliente_cpf].compras[produto_nome]) {
            clientes[cliente_cpf].compras[produto_nome] = {
              nome: produto_nome,
              categoria: categoria_nome,
              preçoR$: Number(preco),
              quantidade: 0,
            };
          }
          clientes[cliente_cpf].compras[produto_nome].quantidade += quantidade;
        }
      }
    );

    const resposta = Object.values(clientes).map((cliente) => ({
      nome: cliente.nome,
      cpf: cliente.cpf,
      compras: Object.values(cliente.compras),
    }));

    res.status(200).json(resposta);
  } catch (err) {
    console.error("Erro ao obter clientes e compras:", err);
    res.status(500).json({ mensagem: "Erro ao obter clientes e compras." });
  }
});

app.delete("/cliente/compras", async (req, res) => {
  const { cpf, compra_id } = req.body;

  // Verifica se o CPF e o compra_id foram fornecidos
  if (!cpf || !compra_id) {
    return res.status(400).json({
      mensagem: "CPF e compra_id são obrigatórios.",
    });
  }

  try {
    // Busca o cliente no banco de dados pelo CPF
    const { rows: clienteRows } = await pool.query(
      "SELECT id, nome FROM clientes WHERE cpf = $1",
      [cpf]
    );

    // Se o cliente não for encontrado, retorna erro 404
    if (clienteRows.length === 0) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    const cliente_id = clienteRows[0].id;
    const cliente_nome = clienteRows[0].nome; // Captura o nome do cliente

    // Recupera os dados da compra antes de excluir
    const { rows: compraRows } = await pool.query(
      `SELECT p.nome AS produto, c.nome AS categoria, p.preco
       FROM produtocompra pc
       JOIN produtos p ON pc.produto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE pc.cliente_id = $1 AND pc.compra_id = $2`,
      [cliente_id, compra_id]
    );

    // Se a compra não for encontrada, retorna erro 404
    if (compraRows.length === 0) {
      return res.status(404).json({ mensagem: "Compra não encontrada." });
    }

    const compra = compraRows[0];

    // Inicia uma transação para garantir a consistência
    await pool.query("BEGIN");

    // Deleta a compra do cliente da tabela produtocompra
    const resultProdutocompra = await pool.query(
      "DELETE FROM produtocompra WHERE cliente_id = $1 AND compra_id = $2",
      [cliente_id, compra_id]
    );

    // Se nenhuma linha for afetada, significa que a compra não foi encontrada na tabela produtocompra
    if (resultProdutocompra.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ mensagem: "Compra não encontrada." });
    }

    // Deleta a compra da tabela compra
    const resultCompra = await pool.query(
      "DELETE FROM compra WHERE id = $1 AND cliente_id = $2",
      [compra_id, cliente_id]
    );

    // Se nenhuma linha for afetada, significa que a compra não foi encontrada na tabela compra
    if (resultCompra.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(404)
        .json({ mensagem: "Compra não encontrada na tabela compra." });
    }

    // Finaliza a transação
    await pool.query("COMMIT");

    // Retorna uma mensagem de sucesso com os dados do produto excluído e o nome do cliente
    res.status(200).json({
      mensagem: "Compra excluída com sucesso!",
      cliente: {
        nome: cliente_nome, // Nome do cliente incluído
      },
      produto_excluido: {
        nome: compra.produto,
        categoria: compra.categoria,
        precoR$: Number(compra.preco), // Convertendo de centavos para reais
      },
    });
  } catch (error) {
    console.error("Erro ao excluir a compra:", error);
    await pool.query("ROLLBACK");
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

// Inicia o servidor na porta 3000 usando npm run dev
const port = 3000;
app.listen(port, () => console.log("Api rodando com sucesso"));
