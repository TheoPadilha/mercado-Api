import React, { useState, useEffect } from "react";
import {
  getCategorias,
  adicionarCategoria,
  editarCategoria,
  excluirCategoria,
} from "../../services/ApiServices";
import "./categoriasCrud.css";

const CategoriasCrud = () => {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState("");
  const [idEdit, setIdEdit] = useState(null);
  const [erro, setErro] = useState(""); // Estado para mensagens de erro

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await getCategorias();
      console.log("Categorias recebidas da API:", response);
      setCategorias(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategorias([]);
    }
  };

  const validarNome = (nome) => {
    console.log("Categorias no validarNome:", categorias); // Verifique se categorias é um array válido
    if (nome.length < 3) {
      setErro("O nome da categoria deve ter pelo menos 3 caracteres.");
      setTimeout(() => setErro(""), 3000);
      return false;
    }

    // Verifique se categorias realmente contém um array de objetos com a chave nome
    if (
      categorias.some(
        (categoria) =>
          categoria &&
          categoria.nome &&
          categoria.nome.toLowerCase() === nome.toLowerCase()
      )
    ) {
      setErro("Já existe uma categoria com esse nome.");
      setTimeout(() => setErro(""), 3000);
      return false;
    }

    setErro(""); // Limpa a mensagem de erro se o nome for válido
    return true;
  };

  const handleAddCategoria = async (e) => {
    e.preventDefault();

    if (!validarNome(nome)) {
      return; // Se o nome for inválido, não prossegue
    }

    const novaCategoria = { nome };

    try {
      await adicionarCategoria(novaCategoria);
      await carregarCategorias();
      resetForm();
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
    }
  };
  const handleEditCategoria = (novaCategoria) => {
    window.scrollTo(0, 0);
    setNome(novaCategoria.nome ?? "");
    setIdEdit(novaCategoria.nome);
  };
  const handleUpdateCategoria = async (e) => {
    e.preventDefault();

    if (!validarNome(nome)) return;

    try {
      await editarCategoria(idEdit, nome);
      await carregarCategorias();
      resetForm();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
    }
  };

  const handleDeleteCategoria = async (nome) => {
    try {
      await excluirCategoria(nome);
      await carregarCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  };

  const resetForm = () => {
    setNome("");
    setIdEdit(null);
    setErro(""); // Limpa a mensagem de erro ao resetar o formulário
  };

  return (
    <div className="categorias-crud-container">
      <h2>Gerenciar Categorias</h2>

      {/* Exibe a mensagem de erro, se houver */}
      {erro && <div className="erro-mensagem">{erro}</div>}

      <form onSubmit={idEdit ? handleUpdateCategoria : handleAddCategoria}>
        <input
          type="text"
          placeholder="Nome da Categoria"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <button type="submit">
          {idEdit ? "Atualizar Categoria" : "Adicionar Categoria"}
        </button>
        {idEdit && (
          <button type="button" className="cancel-btn" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>

      <h3>Categorias</h3>
      <table className="categorias-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categorias.length > 0 ? (
            categorias.map((categoria, index) => (
              <tr key={index}>
                <td>{categoria.nome}</td>
                <td>
                  <button
                    className="editar"
                    onClick={() => handleEditCategoria(categoria)}
                  >
                    Editar
                  </button>
                  <button
                    className="Excluir"
                    onClick={() => handleDeleteCategoria(categoria.nome)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">Nenhuma categoria encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CategoriasCrud;
