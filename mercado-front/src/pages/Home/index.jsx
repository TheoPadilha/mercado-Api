import { useState, useEffect } from "react";
import {
  getClientes,
  adicionarCliente,
  excluirCliente,
  editarCliente,
} from "../../services/ApiServices";
import "./style.css"; // Este estilo pode ser mantido aqui

function formatarCPF(cpf) {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function Home() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteAtual, setClienteAtual] = useState(null);
  const [cpfEdicao, setCpfEdicao] = useState("");
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  // Carregar clientes da API ao iniciar
  const carregarClientes = () => {
    getClientes()
      .then((data) => setClientes(data))
      .catch(() => setErro("Erro ao carregar clientes."));
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleCpfChange = (e) => {
    setCpf(formatarCPF(e.target.value));
  };

  function limparCPF(cpf) {
    return cpf.replace(/\D/g, ""); // Remove tudo que não for número
  }
  // Adicionar novo cliente
  const handleAdicionarCliente = () => {
    if (nome && cpf) {
      const cpfSemFormatacao = limparCPF(cpf); // Remove os pontos e traço

      const cpfExistente = clientes.find(
        (cliente) => limparCPF(cliente.cpf) === cpfSemFormatacao
      );

      if (cpfExistente) {
        setErro("Este CPF já está cadastrado!");
        setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
        return; // Impede que prossiga
      }

      const novoCliente = { nome, cpf: cpfSemFormatacao };
      adicionarCliente(novoCliente)
        .then(() => {
          carregarClientes();
          setNome("");
          setCpf("");
          setErro("");
        })
        .catch(() => {
          setErro("Erro ao cadastrar cliente. Verifique os campos.");
          setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
        });
    } else {
      setErro("Preencha todos os campos!");
      setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
    }
  };

  // Excluir cliente
  const handleExcluirCliente = (cpf) => {
    setClienteParaExcluir(cpf);
    setModalConfirmacaoAberto(true);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = () => {
    if (clienteParaExcluir) {
      excluirCliente(clienteParaExcluir)
        .then(() => {
          carregarClientes();
          setModalConfirmacaoAberto(false);
          setClienteParaExcluir(null);
        })
        .catch(() => {
          setErro(
            "Não é possível excluir o cliente, pois ele possui compras registradas."
          );
          setTimeout(() => setErro(""), 3000); // Limpa a mensagem após 3 segundos
        });
    }
  };

  // Abrir modal de edição
  const handleAbrirModalEdicao = (cliente) => {
    setClienteAtual(cliente);
    setNomeEdicao(cliente.nome);
    setCpfEdicao(cliente.cpf);
    setModalAberto(true);
  };

  // Confirmar edição
  const handleConfirmarEdicao = () => {
    if (!clienteAtual) return;

    // Cria o objeto com nome e novoCpf sempre presente
    const clienteAtualizado = {
        nome: nomeEdicao,
        novoCpf: cpfEdicao || clienteAtual.cpf, // Se não mudou, mantém o CPF original
    };

    editarCliente(clienteAtual.cpf, clienteAtualizado) // Continua buscando pelo CPF original
      .then(() => {
        carregarClientes();
        setModalAberto(false);
        setClienteAtual(null);
      })
      .catch((error) => {
        setErro(error.message || "Erro ao editar cliente.");
        setTimeout(() => setErro(""), 3000);
      });
};

  return (
    <div className="container">
      <h1>Cadastro de Clientes</h1>

      {/* Exibição da mensagem de erro */}
      {erro && <p className="erro">{erro}</p>}

      <form>
        <input
          type="text"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
        />
        <input
          type="text"
          name="cpf"
          value={cpf}
          onChange={handleCpfChange}
          placeholder="CPF"
          maxLength="14"
        />
        <button type="button" onClick={handleAdicionarCliente}>
          Cadastrar
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.cpf}>
              <td>{cliente.nome}</td>
              <td>{cliente.cpf}</td>
              <td>
                <button
                  className="Excluir"
                  onClick={() => handleExcluirCliente(cliente.cpf)}
                >
                  Excluir
                </button>
                <button
                  className="editar-btn"
                  onClick={() => handleAbrirModalEdicao(cliente)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para edição */}
      {modalAberto && (
        <div className="modal">
          <div className="modal-content">
            <h2>Editar Cliente</h2>
            <input
              type="text"
              name="nome"
              value={nomeEdicao}
              onChange={(e) => setNomeEdicao(e.target.value)}
              placeholder="Nome"
            />
            <input
              type="text"
              name="cpf"
              value={cpfEdicao}
              onChange={(e) => setCpfEdicao(formatarCPF(e.target.value))}
              placeholder="CPF"
              maxLength="14"
            />
            <button onClick={handleConfirmarEdicao}>Confirmar Edição</button>
            <button onClick={() => setModalAberto(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal para confirmação de exclusão */}
      {modalConfirmacaoAberto && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir este cliente?</p>
            <button onClick={handleConfirmarExclusao}>Confirmar</button>
            <button onClick={() => setModalConfirmacaoAberto(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
