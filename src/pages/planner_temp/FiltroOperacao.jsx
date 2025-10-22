import React from 'react';

const FiltroOperacao = ({ operacaoSelecionada, setOperacaoSelecionada, operacoes, dataSelecionada, setDataSelecionada }) => (
  <div className="filtros-container">
    <div className="filtro-operacao">
      <label htmlFor="operacao">
        Operação:
      </label>
      <select
        id="operacao"
        value={operacaoSelecionada}
        onChange={(e) => setOperacaoSelecionada(e.target.value)}
      >
        <option value="">Selecione uma operação</option>
        {operacoes.map((op) => (
          <option key={op.id} value={op.nome}>{op.nome}</option>
        ))}
      </select>
    </div>

    <div className="filtro-data">
      <label htmlFor="data">
        Data:
      </label>
      <input
        type="date"
        id="data"
        value={dataSelecionada}
        onChange={(e) => setDataSelecionada(e.target.value)}
      />
    </div>
  </div>
);

export default FiltroOperacao;
