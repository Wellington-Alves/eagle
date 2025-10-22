import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './SeqProducao.module.css';

const TabelaSemanal = () => {
  const [loading, setLoading] = useState(true);
  const [semanaAtual, setSemanaAtual] = useState([]);
  const [programacao, setProgramacao] = useState({});
  const [erro, setErro] = useState(null);

  const maquinas = [
    'Torno CNC', 
    'Torno Conv.', 
    'Fresa', 
    'Romi 560',
    'Vekker', 
    'V400',
  ];

  const obterDiasSemanaAtual = () => {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    
    const diaSemana = hoje.getUTCDay();
    let diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    
    const segunda = new Date(hoje);
    segunda.setUTCDate(hoje.getUTCDate() + diasParaSegunda);
    
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const data = new Date(segunda);
      data.setUTCDate(segunda.getUTCDate() + i + 1);
      console.log("Datas com offset:", semanaAtual.map(d => d.formatado));
      
      // Formatação manual garantida (DD/MM)
      const dia = String(data.getUTCDate()).padStart(2, '0');
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
      
      dias.push({
        data: data,
        formatado: `${dia}/${mes}`,
        diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getUTCDay()]
      });
    }
    
    return dias;
  };

  useEffect(() => {
    const buscarDados = async () => {
      setLoading(true);
      setErro(null);
      try {
        const dias = obterDiasSemanaAtual();
        setSemanaAtual(dias);
        
        const dataKeys = dias.map(d => d.data.toISOString().split('T')[0]);

        const { data: cargas, error: erroCarga } = await supabase
          .from('Carga')
          .select('Os, Posicao, Data, Operacao, Horas_Programadas')
          .in('Data', dataKeys)
          .in('Operacao', maquinas);

        if (erroCarga) throw erroCarga;
        if (!cargas || cargas.length === 0) {
          setProgramacao({});
          return;
        }

        const osValues = [...new Set(cargas.map(c => Number(c.Os)))].filter(os => !isNaN(os));
        const posicaoValues = [...new Set(cargas.map(c => Number(c.Posicao)))].filter(pos => !isNaN(pos));

        const { data: posicoes, error: erroPosicao } = await supabase
          .from('Posicao')
          .select(`
            Os, 
            Posicao,
            Operacao1, Etapas1, Operacao2, Etapas2, Operacao3, Etapas3,
            Operacao4, Etapas4, Operacao5, Etapas5, Operacao6, Etapas6,
            Operacao7, Etapas7, Operacao8, Etapas8, Operacao9, Etapas9,
            Operacao10, Etapas10, Operacao11, Etapas11, Operacao12, Etapas12
          `)
          .in('Os', osValues)
          .in('Posicao', posicaoValues);

        if (erroPosicao) throw erroPosicao;

        const programacaoNova = {};
        maquinas.forEach(maquina => {
          programacaoNova[maquina] = {};
          dias.forEach(dia => {
            programacaoNova[maquina][dia.data.toISOString().split('T')[0]] = [];
          });
        });

        cargas.forEach(carga => {
          const { Os, Posicao, Data, Operacao, Horas_Programadas } = carga;
          const osNum = Number(Os);
          const posicaoNum = Number(Posicao);

          if (maquinas.includes(Operacao) && !isNaN(osNum) && !isNaN(posicaoNum)) {
            const posicaoInfo = posicoes?.find(p => 
              Number(p.Os) === osNum && 
              Number(p.Posicao) === posicaoNum
            );
            const dataKey = new Date(Data).toISOString().split('T')[0];
            
            if (programacaoNova[Operacao]?.[dataKey]) {
              const cor = obterCorPorStatus(Operacao, posicaoInfo);
              const status = obterStatusOperacao(Operacao, posicaoInfo);

              programacaoNova[Operacao][dataKey].push({
                Os,
                Posicao,
                Operacao,
                Horas_Programadas,
                status: status,
                cor: cor,
              });
            }
          }
        });
        
        setProgramacao(programacaoNova);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErro('Erro ao carregar dados da programação.');
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, []);

  const obterCorPorStatus = (operacao, posicaoInfo) => {
    if (!posicaoInfo) return 'red';

    for (let i = 1; i <= 12; i++) {
      const operacaoField = `Operacao${i}`;
      const etapasField = `Etapas${i}`;
      
      if (posicaoInfo[operacaoField] === operacao) {
        const statusEtapa = posicaoInfo[etapasField];
        
        switch (statusEtapa) {
          case 'Concluída':
            return 'green';
          case 'Em Andamento':
            return 'black';
          case 'Aguardando Material':
            return 'orange';
          default:
            return 'black';
        }
      }
    }
    return 'red';
  };

  const obterStatusOperacao = (operacao, posicaoInfo) => {
    if (!posicaoInfo) return 'Não encontrado';

    for (let i = 1; i <= 12; i++) {
      const operacaoField = `Operacao${i}`;
      const etapasField = `Etapas${i}`;
      
      if (posicaoInfo[operacaoField] === operacao) {
        const statusEtapa = posicaoInfo[etapasField];
        return statusEtapa || 'Status não definido';
      }
    }
    return 'Operação não encontrada';
  };

  if (loading) {
    return <div className={styles.loading}>Carregando programação semanal...</div>;
  }

  if (erro) {
    return <div className={styles.error}>{erro}</div>;
  }

  return (
    <div className={styles.tabelaContainer}>
      <h2>Programação Semanal</h2>
      <div className={styles.tabelaScrollContainer}>
        <table className={styles.tabelaSemanal}>
          <thead>
            <tr>
              <th>Máquina</th>
              {semanaAtual.map((dia) => (
                <th key={dia.data.toISOString()}>
                  <div>{dia.diaSemana}</div>
                  <div>{dia.formatado}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maquinas.map((maquina) => (
              <tr key={maquina}>
                <td className={styles.colunaMaquina}>{maquina}</td>
                {semanaAtual.map((dia) => {
                  const dataKey = dia.data.toISOString().split('T')[0];
                  const cargasDia = programacao[maquina]?.[dataKey] || [];
                  
                  return (
                    <td key={dataKey} className={styles.celulaProgramacao}>
                      {cargasDia.length > 0 ? (
                        cargasDia.map((item, idx) => (
                          <div 
                            key={`${item.Os}-${item.Posicao}-${idx}`}
                            className={styles.itemOS}
                            style={{ color: item.cor }}
                            title={`Status: ${item.status} - OS ${item.Os} - Posição ${item.Posicao}`}
                          >
                            <span>OS: {item.Os}</span> - <span>Pos: {item.Posicao}</span> - <span>Horas: {item.Horas_Programadas}</span>
                            <br />
                            <small style={{ fontStyle: 'italic' }}>({item.status})</small>
                          </div>
                        ))
                      ) : (
                        <div>-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelaSemanal;