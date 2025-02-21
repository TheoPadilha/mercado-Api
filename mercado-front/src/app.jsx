import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/index";
import Produtos from "./pages/Home/produtos"; // Importando a página de Produtos
import ProdutosCrud from './pages/Home/produtosCrud';
import CategoriasCrud from './pages/Home/CateoriasCrud'
import Compras from './pages/Home/Compras'

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar">
          <Link to="/clientes">Clientes</Link>
          <Link to="/Mercado">Mercado</Link>
          <Link to="/produtos">Produtos</Link>
          <Link to="/categorias">Categorias</Link>
          <Link to="/compras">Compras</Link>
        </nav>

        <Routes>
          <Route path="/clientes" element={<Home />} />
          <Route path="/Mercado" element={<Produtos />} />
          <Route path="/produtos" element={<ProdutosCrud/>} />
          <Route path="/categorias" element={<CategoriasCrud/>} />
          <Route path="/compras" element={<Compras/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
