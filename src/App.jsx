import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Home from './pages/Home/Home';
import CadastroMaquinas from "./pages/CadastroMaquinas/CadastroMaquinas";
import Calendar from './pages/Calendar/Calendar';
import CadastroOS from './pages/CadastroOS/CadastroOS';
import CadastroPosicoes from './pages/CadastroPosicoes/CadastroPosicoes';
import DataLimite from './pages/DataLimite/DataLimite';
import HorasDisponiveis from './pages/HorasDisponiveis/HorasDisponiveis';
import SeqProducao from './pages/SeqProducao/SeqProducao';
import CartaoPercurso from './pages/CartaoPercurso/CartaoPercurso';
import Carga from './pages/Carga/Carga';
import AlocacaoOS from './pages/Alocacao/AlocacaoOS';
import FichaEnvio from './pages/FichaEnvio/FichaEnvio';
import Planner from './pages/Planner/Planner';
import Acompanhamento from './pages/Acompanhamento/Acompanhamento'; // Importação do componente Acompanhamento
import VisualizadorPlanejamento from './pages/VisualizadorPlanejamento/VisualizadorPlanejamento';


function App() {
  return (
    <DndProvider backend={HTML5Backend}>  {/* Envolvendo com DndProvider */}
      <Router>
        <div className="min-h-screen bg-gray-50">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/maquinas" element={<CadastroMaquinas />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/os" element={<CadastroOS />} />
              <Route path="/posicoes" element={<CadastroPosicoes />} />
              <Route path="/DataLimite" element={<DataLimite />} />
              <Route path="/horas-disponiveis" element={<HorasDisponiveis />} />
              <Route path="/Sequenciamento" element={<SeqProducao />} />
              <Route path="/cartao-percurso" element={<CartaoPercurso />} />
              <Route path="/carga" element={<Carga />} /> 
              <Route path="/alocacao" element={<AlocacaoOS />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/ficha-envio" element={<FichaEnvio />} />
              <Route path="/acompanhamento" element={<Acompanhamento />} /> {/* Nova rota para Acompanhamento */}
              <Route path="/visualizador-planejamento" element={<VisualizadorPlanejamento />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DndProvider>
  );
}

export default App;