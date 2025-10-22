import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import "./CadastroMaquinas.css";

function CadastroMaquinas() {
  const [maquinas, setMaquinas] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novaMaquina, setNovaMaquina] = useState({ NomeMaquina: '', Jornada: '' });

  // Buscar máquinas
  async function fetchMaquinas() {
    setLoading(true);
    const { data, error } = await supabase.from('Maquinas').select('MaquinaID, NomeMaquina, Jornada');
    if (error) {
      setError('Erro ao buscar as máquinas: ' + error.message);
      setLoading(false);
      return;
    }
    setMaquinas(data);
    setLoading(false);
  }

  // Abrir modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setNovaMaquina({ NomeMaquina: '', Jornada: '' });
  };

  // Salvar nova máquina
  const salvarNovaMaquina = async () => {
    const { NomeMaquina, Jornada } = novaMaquina;
    if (!NomeMaquina || !Jornada) {
      setError('Nome da máquina e jornada são obrigatórios.');
      return;
    }

    const { data, error } = await supabase
      .from('Maquinas')
      .insert([{ NomeMaquina, Jornada }])
      .select();

    if (error) {
      setError('Erro ao adicionar a máquina: ' + error.message);
      return;
    }

    setMaquinas([...maquinas, ...data]);
    closeModal();
  };

  // Ordenar máquinas
  const sortedMaquinas = useMemo(() => {
    if (!sortConfig.key) return maquinas;
    return [...maquinas].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [maquinas, sortConfig]);

  // Buscar máquinas ao carregar o componente
  useEffect(() => {
    fetchMaquinas();
  }, []);

  // Lidar com mudanças nos inputs de edição
  const handleInputChange = (maquinaId, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [maquinaId]: { ...prev[maquinaId], [field]: value },
    }));
  };

  // Iniciar edição
  const iniciarEdicao = (maquina) => {
    setEditingId(maquina.MaquinaID);
    setEditedValues((prev) => ({
      ...prev,
      [maquina.MaquinaID]: { NomeMaquina: maquina.NomeMaquina, Jornada: maquina.Jornada },
    }));
  };

  // Salvar edição
  const salvarEdicao = (maquinaId) => {
    const { NomeMaquina, Jornada } = editedValues[maquinaId] || {};
    if (!NomeMaquina || !Jornada) {
      setError('Nome da máquina e jornada são obrigatórios.');
      return;
    }
    editarMaquina(maquinaId, NomeMaquina, Jornada);
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setEditingId(null);
    setEditedValues({});
  };

  // Editar máquina
  const editarMaquina = async (maquinaId, nome, jornada) => {
    const { error } = await supabase
      .from('Maquinas')
      .update({ NomeMaquina: nome, Jornada: jornada })
      .eq('MaquinaID', maquinaId);
    if (error) {
      setError('Erro ao editar a máquina: ' + error.message);
      return;
    }
    setMaquinas((prev) =>
      prev.map((m) => (m.MaquinaID === maquinaId ? { ...m, NomeMaquina: nome, Jornada: jornada } : m))
    );
    setEditingId(null);
  };

  // Excluir máquina
  const excluirMaquina = async (maquinaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta máquina?')) {
      const { error } = await supabase.from('Maquinas').delete().eq('MaquinaID', maquinaId);
      if (error) {
        setError('Erro ao excluir a máquina: ' + error.message);
        return;
      }
      setMaquinas((prev) => prev.filter((m) => m.MaquinaID !== maquinaId));
    }
  };

  return (
    <div className="container">
      <h1 className="title">Cadastro de Máquinas</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Botão "Incluir" */}
      <button className="icon-button add" onClick={openModal}>
        <Plus size={18} /> Incluir
      </button>

      {/* Modal */}
      <div className={`modal ${isModalOpen ? 'open' : ''}`}>
        <div className="modal-content">
          <h2>Adicionar Nova Máquina</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvarNovaMaquina();
            }}
          >
            <label>
              Nome da Máquina:
              <input
                type="text"
                value={novaMaquina.NomeMaquina}
                onChange={(e) => setNovaMaquina({ ...novaMaquina, NomeMaquina: e.target.value })}
                required
              />
            </label>
            <label>
              Jornada:
              <input
                type="text"
                value={novaMaquina.Jornada}
                onChange={(e) => setNovaMaquina({ ...novaMaquina, Jornada: e.target.value })}
                required
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="submit" className="save">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="table-container">
          <table className="machines-table">
            <thead>
              <tr>
                <th onClick={() => setSortConfig({ key: 'NomeMaquina', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Nome da Máquina{' '}
                  {sortConfig.key === 'NomeMaquina' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => setSortConfig({ key: 'Jornada', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Jornada{' '}
                  {sortConfig.key === 'Jornada' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaquinas.map((maquina) => (
                <tr key={maquina.MaquinaID}>
                  <td>
                    {editingId === maquina.MaquinaID ? (
                      <input
                        type="text"
                        className="table-input"
                        value={editedValues[maquina.MaquinaID]?.NomeMaquina || ''}
                        onChange={(e) => handleInputChange(maquina.MaquinaID, 'NomeMaquina', e.target.value)}
                      />
                    ) : (
                      maquina.NomeMaquina
                    )}
                  </td>
                  <td>
                    {editingId === maquina.MaquinaID ? (
                      <input
                        type="text"
                        className="table-input"
                        value={editedValues[maquina.MaquinaID]?.Jornada || ''}
                        onChange={(e) => handleInputChange(maquina.MaquinaID, 'Jornada', e.target.value)}
                      />
                    ) : (
                      maquina.Jornada
                    )}
                  </td>
                  <td className="actions-column">
                    {editingId === maquina.MaquinaID ? (
                      <>
                        <button className="icon-button save" onClick={() => salvarEdicao(maquina.MaquinaID)}>
                          <Save size={18} />
                        </button>
                        <button className="icon-button cancel" onClick={cancelarEdicao}>
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-button edit" onClick={() => iniciarEdicao(maquina)}>
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button className="icon-button delete" onClick={() => excluirMaquina(maquina.MaquinaID)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CadastroMaquinas;