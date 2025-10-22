import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { formatDate } from './formatDate';

function ModalEdicao({ isOpen, onClose, ordem, mode, onSave, onDateChange }) {
  const [formData, setFormData] = useState(ordem);

  useEffect(() => {
    if (ordem) {
      setFormData(ordem);
    }
  }, [ordem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Garantir que a data esteja no formato yyyy-MM-dd
    const formattedDate = formData.DataEntrega
      ? format(parseISO(formData.DataEntrega), 'yyyy-MM-dd')
      : null;

    const updatedOrdem = {
      ...formData,
      DataEntrega: formattedDate,
    };

    onSave(updatedOrdem);
    onClose();
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>{mode === 'create' ? 'Nova Ordem de Serviço' : 'Editar Ordem de Serviço'}</h2>
        <form onSubmit={handleSave}>
          {mode === 'edit' && (
            <div className="form-group">
              <label htmlFor="os">OS:</label>
              <input
                type="text"
                id="os"
                name="Os"
                value={formData.Os}
                onChange={handleInputChange}
                disabled={true}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="numeroOsCliente">Número da OS:</label>
            <input
              type="text"
              id="numeroOsCliente"
              name="NumeroOsCliente"
              value={formData.NumeroOsCliente}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Cliente">Cliente</label>
            <input
              type="text"
              id="Cliente"
              name="Cliente"
              value={formData.Cliente}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="StatusOs">Status</label>
            <input
              type="text"
              id="StatusOs"
              name="StatusOs"
              value={formData.StatusOs}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="DataEntrega">Data de Entrega</label>
            <div className="date-field">
              <input
                type="date"
                id="DataEntrega"
                name="DataEntrega"
                value={formData.DataEntrega || ''}
                onChange={handleInputChange}
                data-date={formData.DataEntrega ? formatDate(formData.DataEntrega) : ''}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Desenho">Desenho</label>
            <input
              type="text"
              id="Desenho"
              name="Desenho"
              value={formData.Desenho}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Coordenador">Coordenador</label>
            <input
              type="text"
              id="Coordenador"
              name="Coordenador"
              value={formData.Coordenador}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Observacao">Observação</label>
            <textarea
              id="Observacao"
              name="Observacao"
              value={formData.Observacao}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Lista">Lista</label>
            <div className="date-field">
              <input
                type="date"
                id="Lista"
                name="Lista"
                value={formatDateForInput(formData.Lista)}
                onChange={handleInputChange}
                data-date={formData.Lista ? formatDateForDisplay(formData.Lista) : ''}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Laminado">Laminado</label>
            <input
              type="text"
              id="Laminado"
              name="Laminado"
              value={formData.Laminado || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Acessorios">Acessórios</label>
            <input
              type="text"
              id="Acessorios"
              name="Acessorios"
              value={formData.Acessorios || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit">
              {mode === 'edit' ? 'Salvar Alterações' : 'Salvar'}
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEdicao;
