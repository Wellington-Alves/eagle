import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, Edit2, Plus, Printer, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import ModalEdicao from './ModalEdicao';
import { formatDate } from './formatDate';
import './CadastroOS.css';

function CadastroOS() {
  const [ordemServico, setOrdemServico] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'Os',
    direction: 'asc',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [search, setSearch] = useState('');
  const [currentOrdem, setCurrentOrdem] = useState({
    NumeroOsCliente: '',
    Cliente: '',
    DataEntrega: '',
    StatusOs: '',
    Observacao: '',
    Desenho: '',
    Coordenador: '',
    Lista: '',
    Laminado: '',
    Acessorios: '',
  });
  const [hideCompleted, setHideCompleted] = useState(false);

  // Função para ordenar por coluna
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar o ícone de ordenação
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={16} style={{ marginLeft: '5px' }} /> : 
      <ChevronDown size={16} style={{ marginLeft: '5px' }} />;
  };

  async function fetchOrdens() {
    setLoading(true);
    try {
      // Fetch all orders with their positions in a single query
      const { data: orders, error: ordersError } = await supabase
        .from('OrdemServico')
        .select(`
          *,
          Posicao:Posicao(StatusPosicao)
        `);

      if (ordersError) throw ordersError;

      // Process orders and calculate averages
      const processedOrders = orders.map(order => {
        const positions = order.Posicao || [];
        let averageStatus = '0%';
        
        if (positions.length > 0) {
          const sum = positions.reduce((acc, pos) => {
            const percentage = parseInt(pos.StatusPosicao) || 0;
            return acc + percentage;
          }, 0);
          
          const average = Math.round(sum / positions.length);
          averageStatus = `${average}%`;
        }

        // Update the order object with the calculated status
        return {
          ...order,
          StatusOs: averageStatus
        };
      });

      // Batch update all orders with their new status
      const updates = processedOrders.map(order => ({
        Os: order.Os,
        StatusOs: order.StatusOs
      }));

      const { error: updateError } = await supabase
        .from('OrdemServico')
        .upsert(updates);

      if (updateError) throw updateError;
      
      setOrdemServico(processedOrders);
      console.log('Status das ordens atualizado com sucesso!');
    } catch (error) {
      setError('Erro ao atualizar os status: ' + error.message);
      console.error('Erro completo:', error);
    } finally {
      setLoading(false);
    }
  }

  // Função para converter strings vazias de data em null
const sanitizeDateFields = (ordem) => {
  return {
    ...ordem,
    DataEntrega: ordem.DataEntrega === '' ? null : ordem.DataEntrega,
    Lista: ordem.Lista === '' ? null : ordem.Lista,
    // Adicione outros campos de data se houver
  };
};

// Update handleCreateOrdem function
const handleCreateOrdem = async (ordem) => {
  // Remove o campo Posicao e outros campos temporários antes de salvar
  const { Posicao, ...ordemSemPosicao } = ordem;
  const ajustedOrdem = sanitizeDateFields({
    ...ordemSemPosicao,
    Laminado: ordem.Laminado,
    Acessorios: ordem.Acessorios
    // Não incluímos 'Os', pois será gerado automaticamente
  });

  const { data, error } = await supabase
    .from('OrdemServico')
    .insert([ajustedOrdem])
    .select();

  if (error) throw error;
  return data[0];
};

// Update handleUpdateOrdem function
const handleUpdateOrdem = async (ordem) => {
  // Remove o campo Posicao e outros campos temporários antes de salvar
  const { Posicao, ...ordemSemPosicao } = ordem;
  const ajustedOrdem = sanitizeDateFields({
    ...ordemSemPosicao,
    Laminado: ordem.Laminado,
    Acessorios: ordem.Acessorios
  });

  const { error } = await supabase
    .from('OrdemServico')
    .update(ajustedOrdem)
    .eq('Os', ordem.Os);

  if (error) throw error;
  return ordem;
};  

  const openModalForCreate = () => {
    setModalMode('create');
    setCurrentOrdem({
      NumeroOsCliente: '',
      Cliente: '',
      DataEntrega: '',
      StatusOs: '',
      Observacao: '',
      Desenho: '',
      Coordenador: '',
      Lista: '',
      Laminado: '',
      Acessorios: '',
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (ordem) => {
    setModalMode('edit');
    setCurrentOrdem({
      ...ordem,
    });
    setIsModalOpen(true);
  };

  const excluirOrdem = async (ordemId) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('OrdemServico')
          .delete()
          .eq('Os', ordemId);

        if (error) throw error;

        setOrdemServico((prev) => prev.filter((o) => o.Os !== ordemId));
      } catch (error) {
        setError('Erro ao excluir a ordem de serviço: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

const filteredAndSortedOrdemServico = useMemo(() => {
  if (!ordemServico) return [];

  const searchLower = search.toLowerCase();

  const filtered = ordemServico.filter((ordem) => {
    // First filter out completed orders if hideCompleted is true
    if (hideCompleted && ordem.StatusOs === '100%') {
      return false;
    }

    return (
      ordem.Os?.toString().toLowerCase().includes(searchLower) ||
      (ordem.NumeroOsCliente && ordem.NumeroOsCliente.toLowerCase().includes(searchLower)) ||
      (ordem.Cliente && ordem.Cliente.toLowerCase().includes(searchLower)) ||
      (ordem.StatusOs && ordem.StatusOs.toLowerCase().includes(searchLower)) ||
      (ordem.Desenho && ordem.Desenho.toLowerCase().includes(searchLower)) ||
      (ordem.Coordenador && ordem.Coordenador.toLowerCase().includes(searchLower))
    );
  });

  return [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    let primaryComparison = 0;

    // Tratamento especial para datas
    if (sortConfig.key === 'DataEntrega' || sortConfig.key === 'Lista') {
      // Converte as datas para objetos Date para comparação
      const aDate = aValue ? new Date(aValue) : new Date(0); // Data mínima se for null/undefined
      const bDate = bValue ? new Date(bValue) : new Date(0);
      
      // Coloca datas nulas/inválidas no final
      if (!aValue && !bValue) primaryComparison = 0;
      else if (!aValue) primaryComparison = 1;
      else if (!bValue) primaryComparison = -1;
      else {
        if (sortConfig.direction === 'asc') {
          primaryComparison = aDate - bDate;
        } else {
          primaryComparison = bDate - aDate;
        }
      }
    }
    // Tratamento especial para números (como OS)
    else if (sortConfig.key === 'Os') {
      const aNum = parseInt(aValue) || 0;
      const bNum = parseInt(bValue) || 0;
      
      if (sortConfig.direction === 'asc') {
        primaryComparison = aNum - bNum;
      } else {
        primaryComparison = bNum - aNum;
      }
    }
    // Tratamento especial para status (ordenação numérica por porcentagem)
    else if (sortConfig.key === 'StatusOs') {
      const aPercent = parseInt(aValue) || 0;
      const bPercent = parseInt(bValue) || 0;
      
      if (sortConfig.direction === 'asc') {
        primaryComparison = aPercent - bPercent;
      } else {
        primaryComparison = bPercent - aPercent;
      }
    }
    // Tratamento padrão para strings
    else {
      if (aValue === bValue) primaryComparison = 0;
      else {
        // Converte para string e trata valores nulos
        const aStr = (aValue || '').toString().toLowerCase();
        const bStr = (bValue || '').toString().toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          primaryComparison = aStr < bStr ? -1 : 1;
        } else {
          primaryComparison = aStr < bStr ? 1 : -1;
        }
      }
    }

    // Se a comparação primária for igual (0), ordenar por OS como critério secundário
    if (primaryComparison === 0) {
      const aOs = parseInt(a.Os) || 0;
      const bOs = parseInt(b.Os) || 0;
      
      // Sempre ordenar OS em ordem crescente como critério secundário
      return aOs - bOs;
    }

    return primaryComparison;
  });
}, [ordemServico, search, sortConfig, hideCompleted]);

  const handlePrint = () => {
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Ordens de Serviço</title>
        <style>
          @media print {
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 15px;
              font-size: 12px; /* Aumentado */
            }
            .print-title {
              font-size: 16px; /* Aumentado */
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
            }
            .machines-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 11px; /* Aumentado */
            }
            .machines-table th,
            .machines-table td {
              padding: 4px;
              border: 1px solid #ddd;
              text-align: left;
              font-size: 11px; /* Aumentado */
            }
            .machines-table th {
              background-color: #f2f2f2;
              font-weight: bold;
              font-size: 12px; /* Aumentado */
            }
            /* Ajustes específicos para colunas */
            .machines-table th:nth-child(8), /* Laminado */
            .machines-table td:nth-child(8) {
              width: 60px !important;
              max-width: 60px !important;
            }
            .machines-table th:nth-child(9), /* Acessórios */
            .machines-table td:nth-child(9) {
              width: 70px !important;
              max-width: 70px !important;
            }
            .machines-table th:nth-child(10), /* Conclusão */
            .machines-table td:nth-child(10) {
              width: 80px !important;
              max-width: 80px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-title">Ordens de Serviço</div>
        <table class="machines-table">
          <thead>
            <tr>
              <th>OS</th>
              <th>O.S Cliente</th>
              <th>Cliente</th>
              <th>Coordenador</th>
              <th>Prazo</th>
              <th>Desenho</th>
              <th>Lista</th>
              <th>Lamin.</th>
              <th>Acessór.</th>
              <th>Conclusão</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedOrdemServico
              .map(
                (ordem) => `
                <tr>
                  <td>${ordem.Os || ''}</td>
                  <td>${ordem.NumeroOsCliente || ''}</td>
                  <td>${ordem.Cliente || ''}</td>
                  <td>${ordem.Coordenador || ''}</td>
                  <td>${formatDate(ordem.DataEntrega)}</td>
                  <td>${ordem.Desenho || ''}</td>
                  <td>${formatDate(ordem.Lista)}</td>
                  <td>${ordem.Laminado || ''}</td>
                  <td>${ordem.Acessorios || ''}</td>
                  <td></td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

  useEffect(() => {
    fetchOrdens();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Cadastro de Ordens de Serviço</h1>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="action-buttons">
        <button 
          className="icon-button add" 
          onClick={openModalForCreate}
          disabled={loading}
        >
          <Plus size={18} /> Incluir
        </button>
        <button 
          className="icon-button refresh" 
          onClick={fetchOrdens}
          disabled={loading}
        >
          <RefreshCw size={18} /> Atualizar
        </button>
        <button 
          className="icon-button print" 
          onClick={handlePrint}
        >
          <Printer size={18} /> Imprimir
        </button>
        <button
          className="icon-button toggle"
          onClick={() => setHideCompleted(!hideCompleted)}
          title={hideCompleted ? "Mostrar ordens concluídas" : "Ocultar ordens concluídas"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          {hideCompleted ? "Mostrar" : "Ocultar"}
        </button>
      </div>
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Pesquisar ordem de serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            disabled={loading}
          />
        </div>
      </div>
      <ModalEdicao
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ordem={currentOrdem}
        mode={modalMode}
        onSave={async (updatedOrdem) => {
          try {
            setLoading(true);
            setError(null);
            // Remove campos temporários antes de salvar
            const { priority, ...ordemParaSalvar } = updatedOrdem;
            const result = modalMode === 'create' 
              ? await handleCreateOrdem(ordemParaSalvar)
              : await handleUpdateOrdem(ordemParaSalvar);
            
            setOrdemServico((prev) =>
              modalMode === 'create'
                ? [...prev, result]
                : prev.map((o) => (o.Os === result.Os ? result : o))
            );
            setIsModalOpen(false);
          } catch (error) {
            setError('Erro ao salvar ordem: ' + error.message);
          } finally {
            setLoading(false);
          }
        }}
      />
      
      <div className="table-container">
        {loading ? (
          <div className="loading-indicator">Carregando ordens de serviço...</div>
        ) : (
          <>
            {filteredAndSortedOrdemServico.length === 0 ? (
              <p className="no-results">Nenhuma ordem de serviço encontrada</p>
            ) : (
              <table className="machines-table">
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('Os')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      OS {getSortIcon('Os')}
                    </th>
                    <th 
                      onClick={() => handleSort('NumeroOsCliente')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      O.S Cliente {getSortIcon('NumeroOsCliente')}
                    </th>
                    <th 
                      onClick={() => handleSort('Cliente')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Cliente {getSortIcon('Cliente')}
                    </th>
                    <th 
                      onClick={() => handleSort('Coordenador')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Coordenador {getSortIcon('Coordenador')}
                    </th>
                    <th 
                      onClick={() => handleSort('DataEntrega')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Prazo {getSortIcon('DataEntrega')}
                    </th>
                    <th 
                      onClick={() => handleSort('Desenho')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Desenho {getSortIcon('Desenho')}
                    </th>
                    <th 
                      onClick={() => handleSort('Lista')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Lista {getSortIcon('Lista')}
                    </th>
                    <th 
                      onClick={() => handleSort('Laminado')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Laminado {getSortIcon('Laminado')}
                    </th>
                    <th 
                      onClick={() => handleSort('Acessorios')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Acessórios {getSortIcon('Acessorios')}
                    </th>
                    <th 
                      onClick={() => handleSort('StatusOs')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Status {getSortIcon('StatusOs')}
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedOrdemServico.map((ordem) => (
                    <tr key={ordem.Os}>
                      <td>{ordem.Os}</td>
                      <td>{ordem.NumeroOsCliente}</td>
                      <td>{ordem.Cliente}</td>
                      <td>{ordem.Coordenador}</td>
                      <td>{formatDate(ordem.DataEntrega)}</td>
                      <td>{ordem.Desenho}</td>
                      <td>{formatDate(ordem.Lista)}</td>
                      <td>{ordem.Laminado}</td>
                      <td>{ordem.Acessorios}</td>
                      <td>{ordem.StatusOs}</td>
                      <td>
                        <button
                          className="icon-button edit"
                          onClick={() => openModalForEdit(ordem)}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => excluirOrdem(ordem.Os)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CadastroOS;