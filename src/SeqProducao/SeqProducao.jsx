import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './SeqProducao.module.css';

const maquinas = [
  'Torno CNC',
  'Torno Conv.',
  'Fresa',
  'Romi 460',
  'Vekker',
  'V400',
];

// Carga diária padrão por máquina
const cargaPadrao = {
  "Torno CNC": 9,
  "Torno Conv.": 9,
  "Fresa": 9,
  "Romi 460": 14,
  "Vekker": 14,
  "V400": 12,
};

const obterDiasUteis = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();
  const dataBase = new Date(ano, mes, dia);
  const diaSemana = dataBase.getDay();

  let diasParaSegunda;
  if (diaSemana === 0) diasParaSegunda = -6;
  else diasParaSegunda = 1 - diaSemana;

  const segunda = new Date(ano, mes, dia + diasParaSegunda);

  const dias = [];
  // Apenas 5 dias da semana atual
  for (let i = 0; i < 5; i++) {
    const data = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i);
    dias.push({
      data,
      formatado: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()],
      chaveData: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`,
    });
  }
  return dias;
};

const SeqProducao = () => {
  const [loading, setLoading] = useState(false);
  const [programacao, setProgramacao] = useState({});
  const [erro, setErro] = useState(null);
  const [cargaDiaria, setCargaDiaria] = useState(cargaPadrao);

  // Atualiza a carga diária de uma máquina
  const handleCargaDiariaChange = (maquina, valor) => {
    const valNum = parseInt(valor, 10);
    if (!isNaN(valNum) && valNum > 0) {
      setCargaDiaria(prev => ({ ...prev, [maquina]: valNum }));
    }
  };

  // Função para buscar dados e montar programação respeitando carga diária
  const buscarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      const dias = obterDiasUteis();
      const dataKeys = dias.map(d => d.chaveData);

      // Busca os dados da tabela Carga filtrando as operações 'Em Andamento'
      // Pegamos OS e Posicao de cargas na semana atual
      const { data: cargas, error: erroCarga } = await supabase
        .from('Carga')
        .select('Os, Posicao, Operacao, Data, Horas_Programadas')
        .in('Data', dataKeys)
        .in('Operacao', maquinas);

      if (erroCarga) throw erroCarga;

      if (!cargas || cargas.length === 0) {
        setProgramacao({});
        setLoading(false);
        return;
      }

      // Conversão mais tolerante de OS e Posição
      const osValues = [...new Set(cargas.map(c => {
        const os = c.Os;
        const numOs = Number(os);
        return !isNaN(numOs) ? numOs : os;
      }))];

      const posValues = [...new Set(cargas.map(c => {
        const pos = c.Posicao;
        const numPos = Number(pos);
        return !isNaN(numPos) ? numPos : pos;
      }))];

      // Busca dados das posições
      const { data: posicoes, error: erroPosicao } = await supabase
        .from('Posicao')
        .select(`
          Os,
          Posicao,
          Operacao1,Operacao2,Operacao3,Operacao4,Operacao5,Operacao6,
          Operacao7,Operacao8,Operacao9,Operacao10,Operacao11,Operacao12,
          Etapas1,Etapas2,Etapas3,Etapas4,Etapas5,Etapas6,
          Etapas7,Etapas8,Etapas9,Etapas10,Etapas11,Etapas12,
          DataLimite1,DataLimite2,DataLimite3,DataLimite4,DataLimite5,DataLimite6,
          DataLimite7,DataLimite8,DataLimite9,DataLimite10,DataLimite11,DataLimite12,
          Horas1,Horas2,Horas3,Horas4,Horas5,Horas6,Horas7,Horas8,Horas9,Horas10,Horas11,Horas12
        `)
        .in('Os', osValues)
        .in('Posicao', posValues);

      if (erroPosicao) throw erroPosicao;

      // Filtrar serviços por etapas (mais flexível)
      const tarefasPorMaquina = {};
      maquinas.forEach(m => tarefasPorMaquina[m] = []);

      const etapasValidas = ['Em Andamento', 'Aguardando Material', 'Pendente', 'A Fazer'];

      posicoes.forEach(pos => {
        for(let i=1; i<=12; i++) {
          const etapa = pos[`Etapas${i}`];
          const operacao = pos[`Operacao${i}`];
          
          // Condição mais flexível para etapas
          if (etapasValidas.includes(etapa) && maquinas.includes(operacao)) {
            const dataLimite = pos[`DataLimite${i}`];
            const horas = pos[`Horas${i}`] || 0;
            
            const tarefa = {
              Os: pos.Os,
              Posicao: pos.Posicao,
              operacao,
              dataLimite: dataLimite ? new Date(dataLimite) : null,
              horas,
              etapaIndex: i,
              etapa: etapa,
            };

            tarefasPorMaquina[operacao].push(tarefa);
          }
        }
      });

      // Ordenar por dataLimite ascendente (mais atrasada primeiro)
      maquinas.forEach(m => {
        tarefasPorMaquina[m].sort((a,b) => {
          if (!a.dataLimite && !b.dataLimite) return 0;
          if (!a.dataLimite) return 1;
          if (!b.dataLimite) return -1;
          return a.dataLimite - b.dataLimite;
        });
      });

      // Obter dias úteis para sequenciamento
      const diasChaves = dias.map(d => d.chaveData);

      // Montar programação respeitando carga diária por máquina e dia
      const programacaoNova = {};
      maquinas.forEach(maquina => {
        programacaoNova[maquina] = {};
        diasChaves.forEach(chave => {
          programacaoNova[maquina][chave] = [];
        });
      });

      // Alocar as tarefas sequencialmente respeitando carga diária e dias úteis
      maquinas.forEach(maquina => {
        let tarefas = tarefasPorMaquina[maquina];
        let diaIndex = 0;
        let cargaRestanteDia = cargaDiaria[maquina];

        tarefas.forEach((tarefa, tarefaIndex) => {
          let horasRestantes = tarefa.horas;

          // Se não há mais dias disponíveis, criar entrada para mostrar overflow
          if (diaIndex >= diasChaves.length && horasRestantes > 0) {
            const proximaSemanaKey = 'overflow-' + maquina;
            if (!programacaoNova[maquina][proximaSemanaKey]) {
              programacaoNova[maquina][proximaSemanaKey] = [];
            }

            const itemProgramacao = {
              Os: tarefa.Os,
              Posicao: tarefa.Posicao,
              Operacao: tarefa.operacao,
              Horas_Programadas: horasRestantes,
              status: tarefa.etapa + ' (Overflow)',
              cor: 'purple',
              etapaIndex: tarefa.etapaIndex,
              dataLimite: tarefa.dataLimite,
              isOverflow: true,
            };

            programacaoNova[maquina][proximaSemanaKey].push(itemProgramacao);
            return; // Pula para próxima tarefa
          }

          while(horasRestantes > 0 && diaIndex < diasChaves.length) {
            const dia = diasChaves[diaIndex];

            if (!programacaoNova[maquina][dia]) {
              programacaoNova[maquina][dia] = [];
            }

            if (cargaRestanteDia === 0) {
              diaIndex++;
              if (diaIndex < diasChaves.length) cargaRestanteDia = cargaDiaria[maquina];
              continue;
            }

            const alocacao = Math.min(horasRestantes, cargaRestanteDia);

            // Determinar cor baseada na etapa
            let cor = 'black';
            switch(tarefa.etapa) {
              case 'Concluída': cor = 'green'; break;
              case 'Em Andamento': cor = 'black'; break;
              case 'Aguardando Material': cor = 'orange'; break;
              case 'Pendente': cor = 'blue'; break;
              case 'A Fazer': cor = 'gray'; break;
              default: cor = 'red'; break;
            }

            const itemProgramacao = {
              Os: tarefa.Os,
              Posicao: tarefa.Posicao,
              Operacao: tarefa.operacao,
              Horas_Programadas: alocacao,
              status: tarefa.etapa,
              cor: cor,
              etapaIndex: tarefa.etapaIndex,
              dataLimite: tarefa.dataLimite,
            };

            programacaoNova[maquina][dia].push(itemProgramacao);

            horasRestantes -= alocacao;
            cargaRestanteDia -= alocacao;

            if (cargaRestanteDia === 0) {
              diaIndex++;
              if (diaIndex < diasChaves.length) cargaRestanteDia = cargaDiaria[maquina];
            }
          }
        });
      });

      setProgramacao(programacaoNova);

    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      setErro(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, [cargaDiaria]);

  const dias = obterDiasUteis();

  // Impressão (personalizada para remover colunas desnecessárias)
  const handleImprimir = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-600px';
    iframe.style.top = '-600px';
    document.body.appendChild(iframe);

    const contentDocument = iframe.contentDocument || iframe.contentWindow.document;

    // Criar tabela customizada para impressão
    const criarTabelaImpressao = () => {
      let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 6px; background-color: #f2f2f2;">Máquina</th>
      `;
      
      // Cabeçalhos dos dias
      dias.forEach(dia => {
        html += `
          <th style="border: 1px solid #ddd; padding: 6px; background-color: #f2f2f2;">
            <div>${dia.diaSemana}</div>
            <div>${dia.formatado}</div>
          </th>
        `;
      });
      
      html += `
            </tr>
          </thead>
          <tbody>
      `;

      // Linhas das máquinas
      maquinas.forEach(maquina => {
        html += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top;">${maquina}</td>
        `;

        dias.forEach(dia => {
          const cargas = programacao[maquina]?.[dia.chaveData] || [];
          html += `
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top;">
          `;

          if (cargas.length > 0) {
            cargas.forEach(item => {
              html += `
                <div style="font-size: 11px; margin: 2px 0; line-height: 1.3;">
                  <span>OS: ${item.Os}</span> - <span>Pos: ${item.Posicao}</span>
                </div>
              `;
            });
          } else {
            html += '<div>-</div>';
          }

          html += `
            </td>
          `;
        });

        html += `
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      return html;
    };

    contentDocument.open();
    contentDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Programação de Produção</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 10mm; }
            h1 { color: #333; font-size: 18px; margin-bottom: 10px; text-align: center; }
            @page { size: A4 landscape; margin: 10mm; }
          </style>
        </head>
        <body>
          <h1>Programação de Produção - ${new Date().toLocaleDateString('pt-BR')}</h1>
          ${criarTabelaImpressao()}
          <script>window.print();</script>
        </body>
      </html>
    `);
    contentDocument.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <h1>Sequenciamento de Produção</h1>

      <div className={`${styles.controls} no-print`}>
        <button onClick={handleImprimir}>Imprimir</button>

        <div style={{ marginTop: 10, fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <span><strong>Legenda:</strong></span>
          <span style={{ color: 'green' }}>● Concluída</span>
          <span style={{ color: 'black' }}>● Em Andamento</span>
          <span style={{ color: 'orange' }}>● Aguardando Material</span>
          <span style={{ color: 'blue' }}>● Pendente</span>
          <span style={{ color: 'gray' }}>● A Fazer</span>
          <span style={{ color: 'purple' }}>● Overflow (próxima semana)</span>
        </div>
      </div>

      {erro && (
        <div className={`${styles.errorFallback} no-print`}>
          <p>{erro}</p>
          <button onClick={buscarDados}>Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className={`${styles.loading} no-print`}>
          <span>Carregando programação...</span>
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabelaSemanal}>
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Carga Diária (h)</th>
                {dias.map(dia => (
                  <th key={dia.chaveData}>
                    <div>{dia.diaSemana}</div>
                    <div>{dia.formatado}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maquinas.map(maquina => (
                <tr key={maquina}>
                  <td className={styles.colunaMaquina}>{maquina}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={cargaDiaria[maquina]}
                      onChange={e => handleCargaDiariaChange(maquina, e.target.value)}
                      style={{ width: '70px' }}
                    />
                  </td>
                  {dias.map(dia => {
                    const cargas = programacao[maquina]?.[dia.chaveData] || [];
                    const totalHoras = cargas.reduce((sum, item) => sum + (item.Horas_Programadas || 0), 0);
                    
                    return (
                      <td key={dia.chaveData} className={styles.celulaProgramacao}>
                        {cargas.length > 0 ? (
                          <>
                            {cargas.map((item, idx) => (
                              <div
                                key={`${item.Os}-${item.Posicao}-${idx}`}
                                className={styles.itemOS}
                                style={{ color: item.cor }}
                                title={`Status: ${item.status} - OS ${item.Os} - Posição ${item.Posicao}${item.dataLimite ? ' - Limite: ' + item.dataLimite.toLocaleDateString('pt-BR') : ''}`}
                              >
                                <span>OS: {item.Os}</span> - <span>Pos: {item.Posicao}</span> - <span>Horas: {item.Horas_Programadas}</span>
                                <br />
                                <small style={{ fontStyle: 'italic' }}>({item.status})</small>
                                {item.dataLimite && (
                                  <><br /><small style={{ color: 'red', fontSize: '10px' }}>
                                    Limite: {item.dataLimite.toLocaleDateString('pt-BR')}
                                  </small></>
                                )}
                              </div>
                            ))}
                            <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '5px', borderTop: '1px solid #ccc', paddingTop: '2px' }}>
                              Total: {totalHoras}h / {cargaDiaria[maquina]}h
                            </div>
                          </>
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
      )}
    </div>
  );
};

export default SeqProducao;