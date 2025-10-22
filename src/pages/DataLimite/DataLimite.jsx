import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './DataLimite.module.css';

// Função para ajustar o fuso horário para GMT+12
const ajustarFusoHorario = (data) => {
  const dataAjustada = new Date(data);
  // Adiciona 12 horas para compensar GMT+12
  dataAjustada.setHours(dataAjustada.getHours() + 12);
  return dataAjustada;
};

// Função para formatar data no fuso correto (YYYY-MM-DD)
const formatarDataISO = (data) => {
  const dataAjustada = ajustarFusoHorario(data);
  return dataAjustada.toISOString().split('T')[0];
};

const calcularNumeroDias = async () => {
  try {
    console.log('======== INÍCIO DO CÁLCULO DE DATAS LIMITE ========');
    console.log('Considerando fuso horário GMT+12');
    
    // Obter dados das tabelas
    const { data: posicoes, error: posicaoError } = await supabase
      .from('Posicao')
      .select('*');
    
    const { data: maquinas, error: maquinaError } = await supabase
      .from('Maquinas')
      .select('*');
    
    const { data: datasUteis, error: datasUteisError } = await supabase
      .from('DatasUteis')
      .select('*');
    
    const { data: ordensServico, error: osError } = await supabase
      .from('OrdemServico')
      .select('*');

    if (posicaoError || maquinaError || datasUteisError || osError) {
      console.error('Erro ao carregar dados:', { posicaoError, maquinaError, datasUteisError, osError });
      return { sucesso: false, erro: 'Erro ao carregar dados' };
    }

    // Mapear dados
    const ordensServicoPorOS = ordensServico.reduce((acc, os) => {
      acc[os.Os] = os;
      return acc;
    }, {});
    
    const maquinasJornada = maquinas.reduce((acc, maquina) => {
      acc[maquina.Nome] = maquina.Jornada || 8;
      return acc;
    }, {});
    
    // Função de verificação com fuso horário ajustado
    const verificarDiaUtil = (data) => {
      const dataAjustada = ajustarFusoHorario(data);
      const dataFormatada = dataAjustada.toISOString().split('T')[0];
      const diaSemana = dataAjustada.getDay();
      
      console.log('\n----------------------------------------');
      console.log('VERIFICANDO DIA ÚTIL (GMT+12):', dataFormatada);
      console.log('Dia da semana:', diaSemana, `(${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana]})`);
      
      const registro = datasUteis.find(d => d.Data === dataFormatada);
      
      if (registro) {
        console.log(`Encontrado registro: DiaUtil = ${registro.DiaUtil}`);
        return registro.DiaUtil;
      }
      
      if (diaSemana === 0 || diaSemana === 6) {
        console.log('Final de semana - dia NÃO útil');
        return false;
      }
      
      console.log('Dia útil padrão');
      return true;
    };
    
    // Função para encontrar dia útil anterior com fuso ajustado
    const encontrarDiaUtilAnterior = (data) => {
      console.log('\nBUSCANDO DIA ÚTIL ANTERIOR (GMT+12)');
      console.log('Data inicial:', formatarDataISO(data));
      
      let dataAtual = ajustarFusoHorario(data);
      let tentativas = 0;
      const maxTentativas = 30;
      
      while (tentativas < maxTentativas) {
        tentativas++;
        dataAtual.setDate(dataAtual.getDate() - 1);
        const dataTeste = dataAtual.toISOString().split('T')[0];
        
        console.log(`Tentativa ${tentativas}: Testando ${dataTeste}`);
        if (verificarDiaUtil(dataAtual)) {
          console.log(`DIA ÚTIL ENCONTRADO: ${dataTeste}`);
          return dataTeste;
        }
      }
      
      console.warn('Não encontrou dia útil após', maxTentativas, 'tentativas');
      return formatarDataISO(data);
    };

    // Processar posições
    const resultados = [];
    
    for (const posicao of posicoes) {
      console.log('\nPROCESSANDO POSIÇÃO:', posicao.PosicaoId);
      
      if (posicao.DataLimite1) {
        console.log('Posição já tem DataLimite1 - pulando');
        continue;
      }
      
      const posicaoAtualizada = { ...posicao };
      const ordemServico = ordensServicoPorOS[posicao.Os];
      
      if (!ordemServico || !ordemServico.DataEntrega) {
        console.log('Sem ordem de serviço ou data de entrega - pulando');
        continue;
      }
      
      // Ajustar data de entrega para GMT+12
      const dataEntrega = ajustarFusoHorario(new Date(ordemServico.DataEntrega));
      console.log('Data de Entrega (GMT+12):', formatarDataISO(dataEntrega));
      
      // Calcular dias para cada operação
      for (let i = 1; i <= 12; i++) {
        const horas = posicao[`Horas${i}`] || 0;
        if (horas > 0) {
          const nomeMaquina = posicao[`NomeMaquina${i}`] || posicao.NomeMaquina || '';
          const jornada = maquinasJornada[nomeMaquina] || 8;
          posicaoAtualizada[`NumeroDias${i}`] = Math.ceil(horas / jornada);
        }
      }
      
      // Encontrar última operação
      let ultimaOperacao = 0;
      for (let i = 12; i >= 1; i--) {
        if ((posicao[`Operacao${i}`] || '') !== '' && (posicao[`Horas${i}`] || 0) > 0) {
          ultimaOperacao = i;
          break;
        }
      }
      
      if (ultimaOperacao === 0) {
        console.log('Sem operações definidas - pulando');
        continue;
      }
      
      // Calcular data limite para última operação (GMT+12)
      const horasUltima = posicao[`Horas${ultimaOperacao}`] || 0;
      const nomeMaquinaUltima = posicao[`NomeMaquina${ultimaOperacao}`] || posicao.NomeMaquina || '';
      const jornadaUltima = maquinasJornada[nomeMaquinaUltima] || 8;
      const diasUltima = Math.ceil(horasUltima / jornadaUltima);
      
      let dataLimite = new Date(dataEntrega);
      dataLimite.setDate(dataLimite.getDate() - (diasUltima + 3));
      
      console.log('\nCálculo data limite (GMT+12):');
      console.log(`Data Entrega: ${formatarDataISO(dataEntrega)}`);
      console.log(`- ${diasUltima} dias (operação)`);
      console.log(`- 3 dias (garantia)`);
      console.log(`Data bruta: ${formatarDataISO(dataLimite)}`);
      
      if (!verificarDiaUtil(dataLimite)) {
        console.log('Ajustando para dia útil anterior...');
        const dataAjustada = encontrarDiaUtilAnterior(dataLimite);
        dataLimite = new Date(dataAjustada);
      }
      
      posicaoAtualizada[`DataLimite${ultimaOperacao}`] = formatarDataISO(dataLimite);
      console.log(`Data limite final: ${formatarDataISO(dataLimite)}`);
      
      // Calcular para operações anteriores
      let dataLimiteAtual = new Date(dataLimite);
      
      for (let i = ultimaOperacao - 1; i >= 1; i--) {
        if ((posicao[`Operacao${i}`] || '') !== '' && (posicao[`Horas${i}`] || 0) > 0) {
          const diasOperacao = posicaoAtualizada[`NumeroDias${i}`] || 0;
          let novaDataLimite = new Date(dataLimiteAtual);
          novaDataLimite.setDate(novaDataLimite.getDate() - diasOperacao);
          
          if (!verificarDiaUtil(novaDataLimite)) {
            const dataAjustada = encontrarDiaUtilAnterior(novaDataLimite);
            novaDataLimite = new Date(dataAjustada);
          }
          
          posicaoAtualizada[`DataLimite${i}`] = formatarDataISO(novaDataLimite);
          dataLimiteAtual = novaDataLimite;
        }
      }
      
      // Atualizar no Supabase
      if (posicaoAtualizada.PosicaoId) {
        const { error } = await supabase
          .from('Posicao')
          .update(posicaoAtualizada)
          .eq('PosicaoId', posicaoAtualizada.PosicaoId);
        
        resultados.push({
          posicaoId: posicaoAtualizada.PosicaoId,
          sucesso: !error,
          erro: error ? error.message : null,
          datasLimite: Object.fromEntries(
            Array.from({ length: ultimaOperacao }, (_, i) => i + 1)
              .filter(i => posicaoAtualizada[`DataLimite${i}`])
              .map(i => [`DataLimite${i}`, posicaoAtualizada[`DataLimite${i}`]])
          )
        });
      }
    }
    
    return { sucesso: true, resultados };
  } catch (error) {
    console.error('Erro durante o processamento:', error);
    return { sucesso: false, erro: error.message };
  }
};

const DataLimiteCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const processarDados = async () => {
      setLoading(true);
      try {
        const res = await calcularNumeroDias();
        setResultado(res);
      } catch (error) {
        console.error('Erro ao processar dados:', error);
        setResultado({ sucesso: false, erro: error.message });
      } finally {
        setLoading(false);
      }
    };

    processarDados();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Cálculo de Datas Limite (GMT+12)</h1>
      
      {loading ? (
        <p className={styles.loading}>Calculando datas limite...</p>
      ) : (
        <div className={styles.resultado}>
          {resultado?.sucesso ? (
            <div className={styles.sucesso}>
              <h2>Processamento concluído!</h2>
              <p>{resultado.resultados?.length || 0} posições atualizadas.</p>
              <div className={styles.resultadosList}>
                {resultado.resultados?.map((res, index) => (
                  <div key={index} className={styles.resultadoItem}>
                    <p>Posição ID: {res.posicaoId}</p>
                    <p>Status: {res.sucesso ? '✅ Sucesso' : '❌ Falha'}</p>
                    {res.erro && <p className={styles.erro}>Erro: {res.erro}</p>}
                    {res.datasLimite && (
                      <div className={styles.datasLimite}>
                        <p>Datas Limite:</p>
                        <ul>
                          {Object.entries(res.datasLimite).map(([key, value]) => (
                            <li key={key}>{key}: {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.erro}>
              <h2>Erro no processamento</h2>
              <p>{resultado?.erro}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataLimiteCalculator;