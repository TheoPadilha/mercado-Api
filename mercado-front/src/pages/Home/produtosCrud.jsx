import React, { useState, useEffect } from "react";
import {
  getProdutos,
  adicionarProduto,
  editarProduto,
  excluirProduto,
} from "../../services/ApiServices";
import "./produtosCrud.css";

const ProdutosCrud = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [preco, setPreco] = useState(0);
  const [idEdit, setIdEdit] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await getProdutos();
      console.log("Dados da API:", response); // <-- Log para depuração
      const categoriasObtidas = Object.keys(response || {}); // Evita erro se for undefined
      const produtosLista = categoriasObtidas.flatMap(
        (categoria) =>
          response[categoria]?.map((produto) => ({ ...produto, categoria })) ||
          []
      );

      // Ordenando os produtos pela ordem alfabética do nome
      produtosLista.sort((a, b) => a.nome.localeCompare(b.nome));

      setCategorias(categoriasObtidas);
      setProdutos(produtosLista);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const categoriaExiste = (categoria) => {
    return categorias.includes(categoria);
  };

  const handleAddProduto = async (e) => {
    e.preventDefault();

    if (!categoriaExiste(categoria)) {
      setErro("Categoria não existe. Por favor, crie a categoria primeiro.");
      setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
      return;
    }

    const produtoExistente = produtos.some(
      (produto) => produto.nome.toLowerCase() === nome.toLowerCase()
    );

    if (produtoExistente) {
      setErro("Já existe um produto com esse nome. Tente outro nome.");
      setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
      return;
    }

    const novoProduto = {
      nome,
      categoria,
      quantidade: Number(quantidade),
      preco: Number(preco),
    };

    try {
      await adicionarProduto(novoProduto);
      await carregarProdutos();
      resetForm();
      setErro("");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const handleEditProduto = (produto) => {
    // Rolando para o topo da página
    window.scrollTo(0, 0);

    setNome(produto.nome ?? ""); // Se for undefined, usa ""
    setCategoria(produto.categoria ?? "");
    setQuantidade(produto.quantidade ?? 0);
    setPreco(produto.preçoR$ ?? 0);
    setIdEdit(produto.nome);
  };

  const handleUpdateProduto = async (e) => {
    e.preventDefault();

    if (!categoriaExiste(categoria)) {
      setErro("Categoria não existe. Por favor, crie a categoria primeiro.");
      setTimeout(() => setErro(""), 3000);
      return;
    }

    const updatedProduto = { nome, categoria, quantidade, preco };

    try {
      await editarProduto(idEdit, updatedProduto);
      await carregarProdutos();
      resetForm();
      setErro("");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  };

  const handleDeleteProduto = async (nome) => {
    try {
      await excluirProduto(nome);
      await carregarProdutos();
    } catch (error) {
      setErro("Erro ao excluir o produto. Tente novamente.");
      setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
      console.error("Erro ao excluir produto:", error);
    }
  };

  const resetForm = () => {
    setNome("");
    setCategoria("");
    setQuantidade("");
    setPreco("");
    setIdEdit(null);
  };

  return (
    <div className="produtos-crud-container">
      <h2>Gerenciar Produtos</h2>

      {erro && <div className="erro-mensagem">{erro}</div>}

      <form onSubmit={idEdit ? handleUpdateProduto : handleAddProduto}>
        <input
          type="text"
          placeholder="Nome do Produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          required
        />
        <button type="submit">
          {idEdit ? "Atualizar Produto" : "Adicionar Produto"}
        </button>
        {idEdit && (
          <button type="button" className="cancel-btn" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>

      <h3>Produtos</h3>
      <table className="produtos-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Preço (R$)</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.length > 0 ? (
            produtos.map((produto, index) => (
              <tr key={index}>
                <td>{produto.nome}</td>
                <td>{produto.categoria}</td>
                <td>{produto.quantidade}</td>
                <td>
                  {produto["preçoR$"]
                    ? `R$ ${produto["preçoR$"].toFixed(2)}`
                    : "N/A"}
                </td>

                <td>
                  <button
                    className="editar"
                    onClick={() => handleEditProduto(produto)}
                  >
                    Editar
                  </button>
                  <button
                    className="Excluir"
                    onClick={() => handleDeleteProduto(produto.nome)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Nenhum produto encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProdutosCrud;
