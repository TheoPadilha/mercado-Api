
# 🛒 API de Mercado

Uma API RESTful completa para gerenciamento de um sistema de mercado, com funcionalidades como cadastro de clientes, produtos, categorias e compras. Conta também com um sistema de validação de CPF e integração com um front-end em React.

## 📌 Funcionalidades

- CRUD de **Clientes**
- CRUD de **Produtos**
- CRUD de **Categorias**
- CRUD de **Compras**
- Validação de **CPF**
- Tela de **vendas** com cálculo de valor total e histórico de compras
- Integração com front-end em **React** + **CSS puro**

## 🛠 Tecnologias Utilizadas

### Backend
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Sequelize](https://sequelize.org/) (ou outro ORM, se aplicável)

### Frontend
- [React.js](https://reactjs.org/)
- [CSS Puro](https://developer.mozilla.org/pt-BR/docs/Web/CSS)

## ⚙️ Como Rodar o Projeto

### Backend

```bash
# Clone o repositório
git clone https://gitlab.com/TheoPadilha/mercado-Api.git

# Acesse a pasta do back-end
cd mercado-Api

# Instale as dependências
npm install

# Configure o banco de dados no arquivo .env
# Exemplo:
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=sua_senha
# DB_NAME=mercado
# DB_PORT=5432

# Rode as migrações/seeds se necessário
npx sequelize db:migrate

# Inicie o servidor
node src/index.js
```

### Frontend

```bash
# Acesse a pasta do front-end
cd client  # substitua com o nome correto da pasta do React

# Instale as dependências
npm install

# Inicie a aplicação
npm start
```

## 📁 Estrutura de Pastas (Frontend)

```bash
src/
├── pages/
│   ├── Home/
│   │   ├── index.jsx
│   │   └── style.css
│   ├── Produtos/
│   ├── Clientes/
│   ├── Compras/
│   └── Categorias/
├── App.jsx
└── index.js
```

## 📮 Principais Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/clientes` | Lista todos os clientes |
| POST | `/clientes` | Cadastra um novo cliente |
| GET | `/produtos` | Lista todos os produtos |
| POST | `/produtos` | Cadastra um novo produto |
| GET | `/categorias` | Lista todas as categorias |
| POST | `/categorias` | Cadastra uma nova categoria |
| POST | `/compras` | Realiza uma compra (CPF + produtos + quantidade) |
| GET | `/compras/:cpf` | Lista compras de um cliente |
| DELETE | `/compras/:id` | Exclui uma compra |

## ✅ Validador de CPF

A API conta com um sistema de validação de CPF para garantir que apenas documentos válidos sejam registrados no sistema.

## 🧠 Lógica de Compra

Ao realizar uma compra, o sistema:

1. Busca o cliente pelo CPF informado.
2. Verifica os produtos e suas quantidades.
3. Calcula o total da compra.
4. Retorna os dados da compra realizada, incluindo nome do cliente, produtos comprados e valor total.

## 📦 Requisitos

- Node.js v18+
- PostgreSQL
- NPM

## 👨‍💻 Autor

**Theo Padilha**  
Desenvolvedor Full Stack  
[LinkedIn](https://www.linkedin.com/in/theopadilha)  
[GitLab](https://gitlab.com/TheoPadilha)  
[GitHub](https://github.com/TheoPadilha)
