import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaTools,
  FaCalendarAlt,
  FaFileAlt,
  FaChartLine,
  FaClock,
  FaCogs,
  FaPuzzlePiece,
  FaPrint,
  FaTruck,
  FaClipboardList,
  FaPaperPlane,
  FaRegCalendarCheck,
  FaEye,
  FaSearch  // ícone para VisualizadorPlanejamento
} from 'react-icons/fa';
import './Home.css';

function Home() {
  // Array de dados dos cards
  const menuItems = [
    { to: "/maquinas", icon: <FaTools />, title: "Cadastro de Máquinas" },
    { to: "/calendar", icon: <FaCalendarAlt />, title: "Cadastro de Dias Úteis" },
    { to: "/os", icon: <FaFileAlt />, title: "Ordem de Serviço (OS)" },
    { to: "/posicoes", icon: <FaPuzzlePiece />, title: "Posições" },
    { to: "/DataLimite", icon: <FaChartLine />, title: "Cálculo de Data Limite" },
    { to: "/horas-disponiveis", icon: <FaClock />, title: "Horas Disponíveis" },
    { to: "/Sequenciamento", icon: <FaCogs />, title: "Seq.de Produção" },
    { to: "/cartao-percurso", icon: <FaPrint />, title: "Imprimir Cartão Percurso" },
    { to: "/carga", icon: <FaTruck />, title: "Carga" },
    { to: "/alocacao", icon: <FaClipboardList />, title: "Alocação" },
    { to: "/ficha-envio", icon: <FaPaperPlane />, title: "Ficha de Envio" },
    { to: "/acompanhamento", icon: <FaEye />, title: "Acompanhamento" },
    { to: "/planner", icon: <FaRegCalendarCheck />, title: "Limpar OS" },
    { to: "/visualizador-planejamento", icon: <FaSearch />, title: "Visualizador Planejamento" }
  ];

  return (
    <div className="container" style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#ffffff',
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    }}>
      {/* Cabeçalho */}
      <header style={{
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 className="title" style={{
          fontSize: '2.5rem',
          color: '#1a73e8',
          marginBottom: '0.5rem',
          letterSpacing: '1px'
        }}>EagleTech</h1>
        <div style={{
          fontSize: '1.2rem',
          color: '#5f6368',
          marginBottom: '1.5rem'
        }}>
          Sistema de Gerenciamento de Produção
        </div>
      </header>

      {/* Grid com links */}
      <div className="links-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.8rem',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Link
              to={item.to}
              className="link-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.5rem',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                transition: 'all 0.3s',
                textDecoration: 'none',
                color: '#202124',
                height: '100%'
              }}
            >
              <div className="icon" style={{
                fontSize: '1.6rem',
                color: '#1a73e8',
                marginRight: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(26, 115, 232, 0.1)'
              }}>{item.icon}</div>
              <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{item.title}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Rodapé */}
      <footer style={{
        marginTop: '3rem',
        color: '#5f6368',
        fontSize: '0.85rem'
      }}>
        &copy; {new Date().getFullYear()} Wellington Alves - Todos os direitos reservados
      </footer>
    </div>
  );
}

export default Home;
