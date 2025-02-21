import React, { useState, useEffect } from "react";
import {
  getClientePorCPF,
  getComprasDoCliente,
  getProdutosList,
  criarCompra,
  deletarCompra,
} from "../../services/ApiServices";
import "./Compras.css";

const Compras = () => {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  const [compras, setCompras] = useState([]);

  // Salvar o estado no localStorage
  useEffect(() => {
    const state = {
      cpf,
      cliente,
      carrinho,
      total,
      compras,
    };
    localStorage.setItem("comprasState", JSON.stringify(state));
  }, [cpf, cliente, carrinho, total, compras]);

  // Restaurar o estado ao montar o componente
  useEffect(() => {
    const savedState = localStorage.getItem("comprasState");
    if (savedState) {
      const state = JSON.parse(savedState);
      setCpf(state.cpf);
      setCliente(state.cliente);
      setCarrinho(state.carrinho);
      setTotal(state.total);
      setCompras(state.compras);
    }
  }, []);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const data = await getProdutosList();
        console.log("Resposta da API:", data);

        if (data && Object.keys(data).length > 0) {
          setProdutos(data);
        } else {
          console.log("Nenhum produto encontrado na resposta da API.");
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProdutos();
  }, []);

  const buscarCliente = async () => {
    if (!cpf) {
      alert("Por favor, insira um CPF.");
      return;
    }

    try {
      const data = await getClientePorCPF(cpf);
      if (data) {
        setCliente(data);
        try {
          const comprasCliente = await getComprasDoCliente(data.cpf);
          console.log("Compras do cliente:", comprasCliente); // Debug
          setCompras(comprasCliente.compras || []); // Garantir que 'compras' seja um array, mesmo que esteja undefined
        } catch (error) {
          console.error("Erro ao carregar compras do cliente:", error);
          alert(
            "Erro ao carregar compras do cliente. Tente novamente mais tarde."
          );
        }
      } else {
        alert("Cliente não encontrado!");
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      alert("Erro ao buscar cliente. Verifique o CPF e tente novamente.");
    }
  };

  const [clicado, setClicado] = useState(false); // Estado para saber se o botão foi clicado

  const adicionarAoCarrinho = (produto) => {
    // Verifica se o produto está esgotado
    if (produto.quantidade === 0 || produto.quantidade === "0") {
      alert("Produto esgotado!");
      return;
    }

    // Verifica se o produto já está no carrinho
    const produtoExistente = carrinho.find(
      (item) => item.nome === produto.nome
    );

    let novoCarrinho;
    if (produtoExistente) {
      // Se o produto já existe, incrementa a quantidade
      novoCarrinho = carrinho.map((item) =>
        item.nome === produto.nome
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
    } else {
      // Se o produto não existe, adiciona ao carrinho com quantidade 1
      novoCarrinho = [...carrinho, { ...produto, quantidade: 1 }];
    }

    setCarrinho(novoCarrinho);
    setTotal(
      novoCarrinho.reduce(
        (acc, item) => acc + (item["preçoR$"] || 0) * item.quantidade,
        0
      )
    );

    // Efeito visual de clique
    setClicado(true);
    setTimeout(() => setClicado(false), 1000);
  };

  const removerDoCarrinho = (produtoNome) => {
    // Filtra o carrinho para remover o produto com o nome especificado
    const novoCarrinho = carrinho.filter((item) => item.nome !== produtoNome);

    setCarrinho(novoCarrinho);
    setTotal(
      novoCarrinho.reduce(
        (acc, item) => acc + (item["preçoR$"] || 0) * item.quantidade,
        0
      )
    );
  };

  const removerCompra = async (compra_id) => {
    try {
      const response = await fetch("http://localhost:3000/cliente/compras", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: cliente.cpf, // O CPF do cliente
          compra_id: compra_id, // O ID da compra que será excluída
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);

        // Atualizando as compras após a exclusão
        const comprasAtualizadas = await getComprasDoCliente(cliente.cpf);
        setCompras(comprasAtualizadas.compras || []);

        alert("Compra excluída com sucesso!");
      } else {
        throw new Error("Erro ao excluir a compra");
      }
    } catch (error) {
      console.error("Erro ao excluir a compra:", error);
      alert("Erro ao excluir a compra.");
    }
  };

  const finalizarCompraCliente = async () => {
    if (!cliente || carrinho.length === 0)
      return alert("Adicione produtos ao carrinho!");

    try {
      const compraData = {
        cpf: cliente.cpf,
        produtos: carrinho.map((produto) => ({
          nomeProduto: produto.nome,
          quantidade: produto.quantidade,
        })),
      };

      console.log("Dados enviados para a API:", compraData);

      const response = await criarCompra(compraData);

      if (response && response.mensagem === "Compra realizada com sucesso!") {
        console.log("Compra realizada com sucesso:", response);

        // Buscar a lista atualizada de compras para garantir que venha com as categorias
        const comprasAtualizadas = await getComprasDoCliente(cliente.cpf);
        setCompras(comprasAtualizadas.compras || []);

        setCarrinho([]);
        setTotal(0);
        alert("Compra finalizada com sucesso!");
      } else {
        throw new Error("Falha na compra");
      }
    } catch (error) {
      alert("Erro ao finalizar compra. Tente novamente mais tarde.");
      console.error("Erro ao finalizar compra:", error);
    }
  };

  const comprasCliente = compras || []; // Garantir que compras sempre seja um array

  // Calcular total gasto em todas as compras
  const totalGasto = comprasCliente.reduce((acc, compra) => {
    return acc + (compra["preçoR$"] * compra.quantidade || 0);
  }, 0);

  return (
    <div className="compras-tela-container">
      <h2>Registrar Compra</h2>

      <div className="cpf-tela-section">
        <input
          type="text"
          placeholder="Digite o CPF"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
        />
        <button onClick={buscarCliente}>Buscar Cliente</button>
        <button
          onClick={() => {
            // Botão de voltar
            localStorage.removeItem("comprasState");
            setCpf("");
            setCliente(null);
            setCarrinho([]);
            setTotal(0);
            setCompras([]);
          }}
        >
          Voltar
        </button>
      </div>

      {cliente && (
        <div>
          <h3>Cliente: {cliente.nome}</h3>
          <h4>Produtos disponíveis:</h4>
          {Object.keys(produtos).length > 0 ? (
            Object.keys(produtos).map((categoria) => (
              <div key={categoria}>
                <h5 className="categoria-tela">{categoria}</h5>
                <table className="tela-produtos-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Preço</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos[categoria].map((produto, index) => (
                      <tr key={index}>
                        <td>{produto.nome}</td>
                        <td>
                          R${" "}
                          {produto["preçoR$"] && !isNaN(produto["preçoR$"])
                            ? produto["preçoR$"].toFixed(2)
                            : "Preço inválido"}
                        </td>
                        <td>
                          {produto.quantidade === 0 ||
                          produto.quantidade === "0" ? (
                            <span className="estoque-esgotado">Esgotado</span>
                          ) : (
                            <button
                              className="Adicionar"
                              onClick={() => adicionarAoCarrinho(produto)}
                            >
                              Adicionar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>Nenhum produto encontrado.</p>
          )}

          <h4>Carrinho:</h4>
          {carrinho.length > 0 ? (
            <ul>
              {carrinho.map((item, index) => (
                <li key={index}>
                  {item.nome} - R${" "}
                  {item["preçoR$"] && !isNaN(item["preçoR$"])
                    ? item["preçoR$"].toFixed(2)
                    : "Preço inválido"}{" "}
                  (Quantidade: {item.quantidade})
                  <button
                    className="remover-do-carrinho"
                    onClick={() => removerDoCarrinho(item.nome)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum produto no carrinho</p>
          )}

          <h3>Total: R$ {total.toFixed(2)}</h3>
          <button onClick={finalizarCompraCliente}>Finalizar Compra</button>

          <h3>Compras do Cliente:</h3>
          {comprasCliente.length === 0 ? (
            <p>O cliente ainda não realizou compras.</p>
          ) : (
            <table className="compras-tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Quantidade</th>
                  <th>Total</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {comprasCliente.map((compra, index) => {
                  // Calculando o total da compra
                  const totalCompra = compra["preçoR$"] * compra.quantidade;
                  return (
                    <tr key={index}>
                      <td>{compra.nome}</td>
                      <td>{compra.categoria}</td>
                      <td>
                        R${" "}
                        {compra["preçoR$"] && !isNaN(compra["preçoR$"])
                          ? compra["preçoR$"].toFixed(2)
                          : "Preço inválido"}
                      </td>
                      <td>{compra.quantidade}</td>
                      <td>R$ {totalCompra.toFixed(2)}</td>
                      <td>
                        <button
                          className="remover"
                          onClick={() => removerCompra(compra.compra_id)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <table className="total-gasto-tabela">
            <thead>
              <tr>
                <th>Total Gasto</th>
                <th>R$ {totalGasto.toFixed(2)}</th>
              </tr>
            </thead>
          </table>
        </div>
      )}
    </div>
  );
};

export default Compras;
