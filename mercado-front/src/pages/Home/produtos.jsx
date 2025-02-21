import React, { useEffect, useState } from "react";
import { getProdutos } from "../../services/ApiServices";
import "./produtos.css"; // Importe o arquivo de estilo

const Produtos = () => {
  const [produtos, setProdutos] = useState({}); // Inicialize com um objeto vazio

  useEffect(() => {
    const fetchProdutos = async () => {
      const data = await getProdutos();
      setProdutos(data); // Atualiza o estado com os dados recebidos da API
    };
    fetchProdutos();
  }, []);

  return (
    <div className="produtos-container">
      <h2>Mercado</h2>
      <table className="produtos-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Preço</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(produtos).length === 0 ? (
            <tr>
              <td colSpan="4">Nenhum produto encontrado.</td>
            </tr>
          ) : (
            Object.keys(produtos).map((categoria) => (
              <React.Fragment key={categoria}>
                {/* Exibe o nome da categoria */}
                <tr className="categoria-title">
                  <td colSpan="4"><strong>{categoria}</strong></td>
                </tr>
                {/* Verifica se há produtos na categoria */}
                {produtos[categoria] && produtos[categoria].length > 0 ? (
                  produtos[categoria].map((produto, index) => (
                    <tr key={index}>
                      <td>{produto.nome}</td>
                      <td>{categoria}</td>
                      <td>{produto.quantidade}</td>
                      <td>R$ {produto.preçoR$.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">Nenhum produto cadastrado nesta categoria.</td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Produtos;
