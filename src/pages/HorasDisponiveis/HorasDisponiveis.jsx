import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaCogs, FaCalendar, FaCalculator, FaClock } from 'react-icons/fa';
import styles from './HorasDisponiveis.module.css';

const HorasDisponiveis = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [horasDisponiveis, setHorasDisponiveis] = useState(null);
  const [erro, setErro] = useState(null);
  const [nomeMaquina, setNomeMaquina] = useState('');
  const [dataDesejada, setDataDesejada] = useState('');
  const [maquinas, setMaquinas] = useState([]);

  // Buscar a lista de máquinas ao carregar o componente
  useEffect(() => {
    const buscarMaquinas = async () => {
      setLoadingMaquinas(true);
      try {
        const { data, error } = await supabase
          .from('Maquinas')
          .select('NomeMaquina');

        if (error) {
          console.error('Erro ao buscar máquinas:', error);
          setErro('Erro ao carregar lista de máquinas.');
          return;
        }

        if (data) {
          setMaquinas(data);
        }
      } catch (error) {
        console.error('Erro ao buscar máquinas:', error);
        setErro('Erro ao carregar lista de máquinas.');
      } finally {
        setLoadingMaquinas(false);
      }
    };

    buscarMaquinas();
  }, []);

  // Função para calcular horas disponíveis
  const calcularHorasDisponiveis = async () => {
    if (!nomeMaquina || !dataDesejada) {
      setErro('Por favor, selecione a máquina e a data desejada.');
      return;
    }

    if (new Date(dataDesejada) < new Date()) {
      setErro('A data desejada não pode ser anterior à data atual. Por favor, selecione uma data futura.');
      return;
    }

    setLoading(true);
    setErro(null);
    setHorasDisponiveis(null);

    try {
      // Buscar a jornada de trabalho da máquina selecionada
      const { data: maquina, error: maquinaError } = await supabase
        .from('Maquinas')
        .select('Jornada')
        .eq('NomeMaquina', nomeMaquina)
        .single();

      if (maquinaError || !maquina) {
        console.error('Erro ao buscar jornada da máquina:', maquinaError);
        setErro(`Máquina "${nomeMaquina}" não encontrada.`);
        return;
      }

      const jornada = maquina.Jornada || 8; // Jornada padrão de 8 horas

      // Buscar dias úteis
      const { data: datasUteis, error: datasUteisError } = await supabase
        .from('DatasUteis')
        .select('Data')
        .gte('Data', new Date().toISOString().split('T')[0]) // A partir de hoje
        .lte('Data', dataDesejada) // Até a data desejada
        .eq('DiaUtil', true); // Apenas dias úteis

      if (datasUteisError) {
        console.error('Erro ao buscar dias úteis:', datasUteisError);
        setErro('Erro ao buscar dias úteis.');
        return;
      }

      // Ordenar dias úteis
      const datasUteisOrdenadas = datasUteis.sort((a, b) => new Date(a.Data) - new Date(b.Data));

      if (datasUteisOrdenadas.length === 0) {
        setErro('Não há dias úteis no período selecionado.');
        return;
      }

      // Calcular horas disponíveis totais
      const horasDisponiveisTotais = datasUteisOrdenadas.length * jornada;

      // Buscar posições da tabela Posicao
      const { data: posicoes, error: posicoesError } = await supabase
        .from('Posicao')
        .select('*');

      if (posicoesError) {
        console.error('Erro ao buscar posições:', posicoesError);
        setErro('Erro ao buscar operações.');
        return;
      }

      // Calcular horas já reservadas
      let horasReservadas = 0;
      const dataAtual = new Date();
      dataAtual.setHours(0, 0, 0, 0);
      const dataFinal = new Date(dataDesejada);
      dataFinal.setHours(23, 59, 59, 999);

      posicoes.forEach((posicao) => {
        for (let i = 1; i <= 12; i++) {
          const operacao = posicao[`Operacao${i}`];
          const dataLimite = posicao[`DataLimite${i}`];
          const horas = parseFloat(posicao[`Horas${i}`]) || 0;

          // Verificar se é a máquina selecionada
          if (operacao && operacao.trim() === nomeMaquina.trim()) {
            // Se DataLimite for null ou estiver dentro do período, contabilizar as horas
            if (!dataLimite || (new Date(dataLimite) >= dataAtual && new Date(dataLimite) <= dataFinal)) {
              horasReservadas += horas;
            }
          }
        }
      });

      // Calcular horas disponíveis finais
      const horasDisponiveisFinais = horasDisponiveisTotais - horasReservadas;

      // Garantir que o resultado não seja negativo
      const resultado = Math.max(0, horasDisponiveisFinais);

      setHorasDisponiveis(resultado);
    } catch (error) {
      console.error('Erro durante o cálculo de horas disponíveis:', error);
      setErro('Erro ao calcular horas disponíveis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Calcular Horas Disponíveis</h1>

      <div className={styles.cardsContainer}>
        {/* Card 1: Seleção de Máquina */}
        <div className={styles.card}>
          <FaCogs className={styles.cardIcon} />
          <h3>Selecione a Máquina</h3>
          <select
            value={nomeMaquina}
            onChange={(e) => setNomeMaquina(e.target.value)}
            disabled={loading || loadingMaquinas}
          >
            {loadingMaquinas ? (
              <option>Carregando máquinas...</option>
            ) : (
              <>
                <option value="">Selecione uma máquina</option>
                {maquinas.map((maquina) => (
                  <option key={maquina.NomeMaquina} value={maquina.NomeMaquina}>
                    {maquina.NomeMaquina}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Card 2: Seleção de Data */}
        <div className={styles.card}>
          <FaCalendar className={styles.cardIcon} />
          <h3>Selecione a Data</h3>
          <input
            type="date"
            value={dataDesejada}
            onChange={(e) => setDataDesejada(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Card 3: Botão de Calcular */}
        <div className={styles.card}>
          <FaCalculator className={styles.cardIcon} />
          <h3>Calcular</h3>
          <button onClick={calcularHorasDisponiveis} disabled={loading}>
            {loading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>

        {/* Card 4: Resultado */}
        <div className={styles.card}>
          <FaClock className={styles.cardIcon} />
          <h3>Horas Disponíveis</h3>
          {loading ? (
            <p>Calculando horas disponíveis...</p>
          ) : horasDisponiveis !== null ? (
            <p>{horasDisponiveis.toFixed(1)} horas disponíveis</p>
          ) : (
            <p>Nenhum cálculo realizado. Selecione uma máquina e uma data para calcular.</p>
          )}
        </div>
      </div>

      {erro && <p className={styles.errorMessage}>{erro}</p>}
    </div>
  );
};

export default HorasDisponiveis;