const API_URL = "http://localhost:3000"; // URL do seu backend

// Funções para Clientes
export const getClientes = async () => {
  try {
    const response = await fetch(`${API_URL}/clientes`);
    if (!response.ok) throw new Error("Erro ao carregar clientes.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const adicionarCliente = async (cliente) => {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Tenta capturar a resposta do backend
      if (
        errorData.message &&
        errorData.message.includes("CPF já cadastrado")
      ) {
        throw new Error(
          "CPF já cadastrado! Não é possível cadastrar clientes com o mesmo CPF."
        );
      }
      throw new Error("Erro ao cadastrar cliente.");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const excluirCliente = async (cpf) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${cpf}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao excluir cliente.");
    return cpf;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const editarCliente = async (cpf, clienteAtualizado) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${cpf}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clienteAtualizado),
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || "Erro ao editar cliente.");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    throw error;
  }
};

export const getClientePorCPF = async (cpf) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${cpf}`);
    if (!response.ok) throw new Error("Erro ao buscar cliente.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Funções para Produtos
export const getProdutos = async () => {
  try {
    const response = await fetch(`${API_URL}/mercado`);
    if (!response.ok) throw new Error("Erro ao carregar produtos.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProdutosList = async () => {
  try {
    const response = await fetch(`${API_URL}/mercado`);
    if (!response.ok) {
      throw new Error("Erro ao carregar produtos.");
    }
    const data = await response.json();
    console.log("Resposta da API:", data); // Verifique a estrutura no console
    return data; // Retorna produtos, ou um array vazio caso não exista
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    return []; // Em caso de erro, retorna um array vazio
  }
};

export const adicionarProduto = async (produto) => {
  try {
    const response = await fetch(`${API_URL}/mercado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto),
    });
    if (!response.ok) throw new Error("Erro ao cadastrar produto.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const excluirProduto = async (nome) => {
  try {
    const response = await fetch(`${API_URL}/mercado/${nome}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao excluir produto.");
    return nome;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const editarProduto = async (nome, produtoAtualizado) => {
  try {
    const response = await fetch(`${API_URL}/mercado/${nome}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produtoAtualizado),
    });
    if (!response.ok) throw new Error("Erro ao editar produto.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Funções para Categorias
export const getCategorias = async () => {
  try {
    const response = await fetch(`${API_URL}/mercado/categoria`);
    if (!response.ok) throw new Error("Erro ao carregar categorias.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const adicionarCategoria = async (categoria) => {
  try {
    const response = await fetch(`${API_URL}/mercado/categoria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoria),
    });
    if (!response.ok) throw new Error("Erro ao cadastrar categoria.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const editarCategoria = async (categoriaAtual, novaCategoria) => {
  const response = await fetch(
    `${API_URL}/mercado/categoria/${categoriaAtual}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novaCategoria }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.mensagem);
  return data;
};

export const excluirCategoria = async (nome) => {
  try {
    const response = await fetch(`${API_URL}/mercado/categoria/${nome}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao excluir categoria.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Funções para Compras
export const getCompras = async () => {
  try {
    const response = await fetch(`${API_URL}/clientes/compras`);
    if (!response.ok) throw new Error("Erro ao carregar compras.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const adicionarCompra = async (compra) => {
  try {
    const response = await fetch(`${API_URL}/cliente/compra`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(compra),
    });
    if (!response.ok) {
      throw new Error("Falha ao adicionar compra");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao adicionar compra:", error);
    throw error; // Para ser capturado pelo catch em `finalizarCompraCliente`
  }
};

export const getComprasDoCliente = async (cpf) => {
  try {
    const response = await fetch(`${API_URL}/cliente/compras/${cpf}`);
    if (!response.ok) throw new Error("Erro ao carregar compras do cliente.");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deletarCompra = async (cpf, compra_id) => {
  try {
    const response = await fetch(`${API_URL}/cliente/compras`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cpf: cpf,
        compra_id: compra_id,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao deletar compra:", error);
    throw new Error("Erro ao deletar compra.");
  }
};

export const criarCompra = async (dadosCompra) => {
  try {
    const resposta = await fetch(`${API_URL}/cliente/compra`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosCompra),
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP! Status: ${resposta.status}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Erro ao criar compra:", erro);
  }
};
