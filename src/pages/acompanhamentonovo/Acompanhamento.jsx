import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Helmet } from 'react-helmet';
import './Acompanhamento.css';

function Acompanhamento() {
  const [posicoes, setPosicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [osAgrupadas, setOsAgrupadas] = useState({});
  const [diasAdiantamento, setDiasAdiantamento] = useState(0);

  const TOTAL_OPERACOES = 12;

  useEffect(() => {
    const fetchPosicoesAtrasadas = async () => {
      try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataLimiteAdiantada = new Date(hoje);
        dataLimiteAdiantada.setDate(dataLimiteAdiantada.getDate() + diasAdiantamento);

        // Busca as operações e informações adicionais, incluindo DataEntrega da OrdemServico
        const campos = Array.from({ length: TOTAL_OPERACOES }, (_, i) => [
          `DataLimite${i + 1}`,
          `Operacao${i + 1}`,
          `Etapas${i + 1}`
        ]).flat().join(', ');

        const { data, error } = await supabase
          .from('Posicao')
          .select(`
            Os, 
            Posicao, 
            QuantidadePecas, 
            ${campos},
            OrdemServico!inner(DataEntrega)
          `)
          .lte(`DataLimite1`, dataLimiteAdiantada.toISOString())
          .order('Os', { ascending: true })
          .order('Posicao', { ascending: true });

        if (error) throw error;

        // Filtrar posições que realmente têm operações atrasadas
        const posicoesComAtraso = data.filter(posicao => {
          for (let i = 0; i < TOTAL_OPERACOES; i++) {
            const dataLimite = posicao[`DataLimite${i + 1}`];
            const etapa = posicao[`Etapas${i + 1}`];
            
            if (estaAtrasado(dataLimite, etapa, diasAdiantamento)) {
              return true;
            }
          }
          return false;
        });

        // Agrupar posições por OS
        const grupos = {};
        posicoesComAtraso.forEach(posicao => {
          if (!grupos[posicao.Os]) {
            grupos[posicao.Os] = [];
          }
          grupos[posicao.Os].push(posicao);
        });

        setOsAgrupadas(grupos);
        setPosicoes(posicoesComAtraso || []);
      } catch (error) {
        console.error('Erro ao buscar posições atrasadas:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosicoesAtrasadas();
  }, [diasAdiantamento]);

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    date.setDate(date.getDate() + 1);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const formatarDataCompleta = (data) => {
    if (!data) return '';
    const date = new Date(data);
    date.setHours(date.getHours() + 12); // Adiciona 12 horas para corrigir o fuso horário
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const CelulaPosicao = ({ numero, quantidade }) => (
    <div className="posicao-celula">
      <div className="posicao-label">Posição</div>
      <div className="posicao-numero">
        {numero}
        {quantidade ? <div className="posicao-quantidade">({quantidade}x)</div> : null}
      </div>
    </div>
  );

  const abreviarOperacao = (operacao) => {
    switch (operacao) {
      case 'Torno Conv.': return 'Tn. Conv.';
      case 'Torno CNC': return 'Tn. CNC';
      case 'Terceiros': return "III's";
      case 'Trat. Termico': return 'T.T';
      default: return operacao;
    }
  };

  const abreviarEtapa = (etapa) => {
    switch (etapa) {
      case 'Aguardando Material': return 'Mat. Prima';
      case 'Em Andamento': return 'Em Proc.';
      case 'Concluída': return 'Concl.';
      case 'Cancelada': return 'Canc.';
      default: return etapa;
    }
  };

  const estaAtrasado = (dataLimite, etapa, diasAdiantamento) => {
    if (!dataLimite || !etapa || etapa === 'Concluída' || etapa === 'Cancelada') {
      return false;
    }

    const hoje = new Date();
    const dataLimiteObj = new Date(dataLimite);

    hoje.setHours(0, 0, 0, 0);
    dataLimiteObj.setHours(0, 0, 0, 0);

    const dataLimiteAdiantada = new Date(hoje);
    dataLimiteAdiantada.setDate(dataLimiteAdiantada.getDate() + diasAdiantamento);

    return dataLimiteObj < dataLimiteAdiantada;
  };

  const temOperacaoAtrasada = (posicao, diasAdiantamento) => {
    for (let i = 0; i < TOTAL_OPERACOES; i++) {
      const dataLimite = posicao[`DataLimite${i + 1}`];
      const etapa = posicao[`Etapas${i + 1}`];
      
      if (estaAtrasado(dataLimite, etapa, diasAdiantamento)) {
        return true;
      }
    }
    return false;
  };

  const deveExibirOperacao = (posicao, indiceOperacao, diasAdiantamento) => {
    const dataLimite = posicao[`DataLimite${indiceOperacao + 1}`];
    const etapa = posicao[`Etapas${indiceOperacao + 1}`];
    
    // Se não tem data limite, não exibe
    if (!dataLimite) return false;
    
    // Encontra a primeira operação atrasada
    let primeiraAtrasada = -1;
    for (let i = 0; i < TOTAL_OPERACOES; i++) {
      const dataLimiteCheck = posicao[`DataLimite${i + 1}`];
      const etapaCheck = posicao[`Etapas${i + 1}`];
      
      if (estaAtrasado(dataLimiteCheck, etapaCheck, diasAdiantamento)) {
        primeiraAtrasada = i;
        break;
      }
    }
    
    // Se não há operações atrasadas, não exibe nada
    if (primeiraAtrasada === -1) return false;
    
    // Exibe a partir da primeira operação atrasada
    return indiceOperacao >= primeiraAtrasada;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-wrapper" style={{ transform: 'scale(0.75)', transformOrigin: 'top left' }}>
      <Helmet>
        <title>Acompanhamento - Posições Atrasadas</title>
        <meta name="description" content="Acompanhamento de posições com operações atrasadas" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>

      <h1 className="main-title no-print">Acompanhamento de Posições Atrasadas</h1>
      
      <div className="content-container">
        <div className="dias-adiantamento no-print">
          <label htmlFor="diasAdiantamento">Dias para Adiantamento:</label>
          <select
            id="diasAdiantamento"
            value={diasAdiantamento}
            onChange={(e) => setDiasAdiantamento(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5].map(dia => (
              <option key={dia} value={dia}>
                {dia} dia{dia !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : posicoes.length === 0 ? (
          <div className="no-results">Nenhuma posição atrasada encontrada.</div>
        ) : (
          <div className="results-panel print-container">
            <div className="print-panel">
              <div className="results-container">
                {Object.keys(osAgrupadas).map((os) => (
                  <div key={os} className="os-group">
                    <h2 className="os-title">
                      OS: {os} - Prazo: {formatarDataCompleta(osAgrupadas[os][0]?.OrdemServico?.DataEntrega)}
                    </h2>
                    {osAgrupadas[os].map((pos, posIndex) => {
                      return (
                        <div key={posIndex} className="resultado-grade">
                          <div className="processos-grid">
                            <CelulaPosicao numero={pos.Posicao} quantidade={pos.QuantidadePecas} />
                            
                            {Array.from({ length: TOTAL_OPERACOES }, (_, i) => {
                              const operacao = pos[`Operacao${i + 1}`] ? abreviarOperacao(pos[`Operacao${i + 1}`]) : '';
                              const dataLimite = pos[`DataLimite${i + 1}`];
                              const etapa = pos[`Etapas${i + 1}`] ? abreviarEtapa(pos[`Etapas${i + 1}`]) : '';
                              const atrasado = estaAtrasado(dataLimite, pos[`Etapas${i + 1}`], diasAdiantamento);
                              
                              // Verifica se deve exibir esta operação (a partir da primeira atrasada)
                              if (!deveExibirOperacao(pos, i, diasAdiantamento)) return null;
                              
                              return (
                                <div
                                  key={i}
                                  className="operacao-data"
                                  style={{
                                    backgroundColor: atrasado ? '#ffebee' : '#f5f5f5',
                                    border: atrasado ? '1px solid #ef9a9a' : '1px solid #ccc',
                                    gridColumn: `${i + 2}`
                                  }}
                                >
                                  <div className="operacao">{operacao || `Operação ${i + 1}`}</div>
                                  <div className="data-limite">{formatarData(dataLimite)}</div>
                                  <div className="etapa" data-etapa={pos[`Etapas${i + 1}`]}>
                                    {etapa}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handlePrint} className="print-button no-print">
              Imprimir Lista Completa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Acompanhamento;