import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './SeqProducao.module.css';

const SeqProducao = () => {
  const [loading, setLoading] = useState(false);
  const [programacao, setProgramacao] = useState({});
  const [erro, setErro] = useState(null);
  const [semanasAdicionais, setSemanasAdicionais] = useState(0);

  const maquinas = [
    'Torno CNC',
    'Torno Conv.',
    'Fresa',
    'Romi 560',
    'Vekker',
    'V400',
  ];

  const obterDiasUteis = (semanasAdd = 0) => {
  const hoje = new Date();
  
  // Força usar sempre o horário local brasileiro
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();
  
  // Recria a data para garantir que está no horário local
  const dataBase = new Date(ano, mes, dia);
  const diaSemana = dataBase.getDay();
  
  let diasParaSegunda;
  if (diaSemana === 0) { // Domingo
    diasParaSegunda = -6;
  } else {
    diasParaSegunda = 1 - diaSemana;
  }

  diasParaSegunda += semanasAdd * 7;
  
  const segunda = new Date(ano, mes, dia + diasParaSegunda);
  
  const dias = [];
  for (let i = 0; i < 5; i++) {
    const data = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i);
    
    const diaObj = {
      data: data,
      formatado: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()],
      // Gera chave da data manualmente para evitar problemas de fuso horário
      chaveData: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
    };
    dias.push(diaObj);
  }
  return dias;
};

// Também atualize o código que usa as datas para usar a nova propriedade:
// No lugar de: dia.data.toISOString().split('T')[0]
// Use: dia.chaveData

  // Funções obterCorPorStatus, obterStatusOperacao, buscarDados, handleImprimir...
  // (O restante do seu código permanece inalterado)

  // Função para determinar a cor baseada no status da etapa
  const obterCorPorStatus = (operacao, posicaoInfo) => {
    if (!posicaoInfo) return 'red'; // Mudado para 'red' para 'Não Encontrado' na Posicao

    // Procura qual operação corresponde à operação atual
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
            return 'black'; // Padrão para status não reconhecidos
        }
      }
    }
    
    return 'red'; // Operação não encontrada na tabela Posição
  };

  // Função para obter o status textual da operação
  const obterStatusOperacao = (operacao, posicaoInfo) => {
    if (!posicaoInfo) return 'Não encontrado';

    // Procura qual operação corresponde à operação atual
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

  const buscarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      const dias = obterDiasUteis(semanasAdicionais);
      // Mapeia para strings de data no formato AAAA-MM-DD (UTC) para a query do Supabase
      const dataKeys = dias.map(d => d.data.toISOString().split('T')[0]);

      // 1. Busca dados da Carga
      const { data: cargas, error: erroCarga } = await supabase
        .from('Carga')
        .select('Os, Posicao, Data, Operacao, Horas_Programadas')
        .in('Data', dataKeys)
        .in('Operacao', maquinas); // Filtra pelas máquinas atualizadas

      if (erroCarga) throw erroCarga;
      if (!cargas || cargas.length === 0) {
        setProgramacao({});
        setLoading(false); // Desliga o loading mesmo sem dados
        return;
      }

      // 2. Busca dados correspondentes na Posicao (incluindo todas as operações e etapas)
      // Mapeia OS e Posicao das cargas para buscar na tabela Posicao
      const osValues = [...new Set(cargas.map(c => Number(c.Os)))].filter(os => !isNaN(os));
      const posicaoValues = [...new Set(cargas.map(c => Number(c.Posicao)))].filter(pos => !isNaN(pos));

      const { data: posicoes, error: erroPosicao } = await supabase
        .from('Posicao')
        .select(`
          Os, 
          Posicao,
          Operacao1, Operacao2, Operacao3, Operacao4, Operacao5, Operacao6,
          Operacao7, Operacao8, Operacao9, Operacao10, Operacao11, Operacao12,
          Etapas1, Etapas2, Etapas3, Etapas4, Etapas5, Etapas6,
          Etapas7, Etapas8, Etapas9, Etapas10, Etapas11, Etapas12
        `)
        .in('Os', osValues)
        .in('Posicao', posicaoValues);

      if (erroPosicao) throw erroPosicao;

      // 3. Processamento dos dados com verificação de operações e etapas
      const programacaoNova = {};
      maquinas.forEach(maquina => {
        programacaoNova[maquina] = {};
        dias.forEach(dia => {
          // Inicializa cada célula da tabela com um array vazio
          programacaoNova[maquina][dia.data.toISOString().split('T')[0]] = [];
        });
      });

      cargas.forEach(carga => {
        const { Os, Posicao, Data, Operacao, Horas_Programadas } = carga;
        const osNum = Number(Os);
        const posicaoNum = Number(Posicao);

        // Verifica se a operação da carga está na lista de máquinas válidas e se OS/Posição são números
        if (maquinas.includes(Operacao) && !isNaN(osNum) && !isNaN(posicaoNum)) {
          // Encontra a linha correspondente na tabela 'Posicao'
          const posicaoInfo = posicoes?.find(p => 
            Number(p.Os) === osNum && 
            Number(p.Posicao) === posicaoNum
          );

          // Pega a chave da data (AAAA-MM-DD) para a célula da tabela
          const dataKey = new Date(Data).toISOString().split('T')[0];
          
          // Adiciona a carga à célula correta na programação
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
              posicaoInfo: posicaoInfo // Mantém referência para debug se necessário
            });
          }
        }
      });

      setProgramacao(programacaoNova);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro('Erro ao carregar dados. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para carregar os dados sempre que 'semanasAdicionais' muda.
  // Isso garante que a tabela seja atualizada ao selecionar uma semana diferente.
  useEffect(() => {
    buscarDados();
  }, [semanasAdicionais]); // Dependência: semanasAdicionais

  // Função para lidar com a impressão do cronograma
  const handleImprimir = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-600px';
    iframe.style.top = '-600px';
    document.body.appendChild(iframe);

    const contentDocument = iframe.contentDocument || iframe.contentWindow.document;
    const tabelaOriginal = document.querySelector(`.${styles.tabelaSemanal}`);
    
    if (!tabelaOriginal) {
      console.error("Tabela de programação não encontrada para impressão.");
      return;
    }

    const tabelaClone = tabelaOriginal.cloneNode(true);

    contentDocument.open();
    contentDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Programação de Produção</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 10mm; }
            h1 { color: #333; font-size: 18px; margin-bottom: 10px; text-align: center; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; }
            .itemOS { font-size: 11px; margin: 2px 0; line-height: 1.3; }
            .concluida { color: green; }
            .em-andamento { color: black; }
            .aguardando-material { color: orange; }
            .nao-encontrado { color: red; }
            /* Estilos para impressão */
            @page { size: A4 landscape; margin: 10mm; } /* Tentar paisagem para tabelas largas */
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>Programação de Produção - ${new Date().toLocaleDateString('pt-BR')}</h1>
          ${tabelaClone.outerHTML}
          <script>window.print();</script>
        </body>
      </html>
    `);
    contentDocument.close();

    // Remove o iframe após um pequeno atraso para permitir a impressão
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000); // 1 segundo
  };

  // Obtém os dias úteis para exibição na tabela
  const dias = obterDiasUteis(semanasAdicionais);

  return (
    <div className={styles.container}>
      <h1>Sequenciamento de Produção</h1>

      <div className={`${styles.controls} no-print`}>
        <label htmlFor="semanasSelect">Mostrar: </label>
        <select
          id="semanasSelect" // Adicionado id para acessibilidade
          value={semanasAdicionais}
          onChange={(e) => setSemanasAdicionais(parseInt(e.target.value))}
        >
          <option value={0}>Semana atual</option>
          <option value={1}>+1 semana</option>
          <option value={2}>+2 semanas</option>
          <option value={3}>+3 semanas</option>
        </select>

        <button onClick={handleImprimir}>Imprimir</button>
        
        {/* Legenda de cores */}
        <div style={{ marginTop: '10px', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <span><strong>Legenda:</strong></span>
          <span style={{ color: 'green' }}>● Concluída</span>
          <span style={{ color: 'black' }}>● Em Andamento</span>
          <span style={{ color: 'orange' }}>● Aguardando Material</span>
          <span style={{ color: 'red' }}>● Não Encontrado</span>
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
          {/* Você pode substituir isso por um spinner MUI ou um GIF de carregamento */}
          <div className={styles.spinner}></div> 
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabelaSemanal}>
            <thead>
              <tr>
                <th>Máquina</th>
                {dias.map(dia => (
                  <th key={dia.data.toISOString()}> {/* Usar a string ISO para a key */}
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
                  {dias.map(dia => {
                    const dataKey = dia.data.toISOString().split('T')[0]; // Chave da data no formato AAAA-MM-DD
                    const cargas = programacao[maquina]?.[dataKey] || [];
                    
                    return (
                      <td key={dataKey} className={styles.celulaProgramacao}>
                        {cargas.length > 0 ? (
                          cargas.map((item, idx) => (
                            <div 
                              key={`${item.Os}-${item.Posicao}-${idx}`} // Key mais robusta
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
      )}
    </div>
  );
};

export default SeqProducao;