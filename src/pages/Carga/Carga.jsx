import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  MenuItem,
  Button,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
  CircularProgress // Adicionado para o indicador de carregamento
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../../supabaseClient';

// Lista de máquinas consideradas para a "Carga Total"
const CARGA_TOTAL_MAQUINAS = [
  'Bancada',
  'Fresa',
  'Vekker',
  'Fresa CNC',
  'Torno Conv.',
  'Torno CNC'
];

export default function DashboardPage() {
  const [maquinaSelecionada, setMaquinaSelecionada] = useState('');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('quinzenal');
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [diasUteisBrutos, setDiasUteisBrutos] = useState([]); // Armazena as strings de data brutas do DB
  const [isLoading, setIsLoading] = useState(false); // Estado para indicar carregamento

  // --- Funções Auxiliares de Data ---

  // Função para formatar data para exibição no gráfico (DD/MM)
  // Assume que a 'dateString' vem do DB no formato YYYY-MM-DD e deve ser tratada como UTC.
  const formatarDataParaDisplay = useCallback((dateString) => {
    try {
      // Adiciona 'T00:00:00Z' para garantir que a string seja interpretada como UTC.
      // Isso evita que o JavaScript mude o dia baseado no fuso horário local.
      const d = new Date(`${dateString}T00:00:00Z`);
      const dia = d.getUTCDate().toString().padStart(2, '0'); // Pega o dia UTC
      const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0'); // Pega o mês UTC
      return `${dia}/${mes}`;
    } catch (e) {
      console.error("Erro ao formatar data para display:", e, dateString);
      return '';
    }
  }, []);

  // Função para formatar objeto Date para consulta no Supabase (YYYY-MM-DD)
  // Garante que a data seja enviada ao DB em um formato UTC consistente.
  const formatarDataParaQuery = useCallback((date) => {
    // toISOString() retorna uma string UTC (ex: "2024-07-16T03:00:00.000Z").
    // .split('T')[0] pega apenas a parte da data (ex: "2024-07-16").
    return date.toISOString().split('T')[0];
  }, []);

  // --- Efeitos de Carregamento Inicial ---

  // useEffect para carregar a lista de máquinas e os dias úteis do banco de dados.
  // Executa apenas uma vez ao montar o componente.
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      // Carregar máquinas
      const { data: maquinasData, error: maquinasError } = await supabase.from('Maquinas').select('NomeMaquina');
      if (!maquinasError && maquinasData) {
        setMaquinas(maquinasData.map((m) => m.NomeMaquina));
      } else if (maquinasError) {
        console.error('Erro ao carregar máquinas:', maquinasError);
      }

      // Carregar dias úteis (strings de data bruta em UTC do DB)
      const { data: datasUteisData, error: datasUteisError } = await supabase
        .from('DatasUteis')
        .select('Data')
        .eq('DiaUtil', true)
        .order('Data', { ascending: true }); // Garante a ordem

      if (!datasUteisError && datasUteisData) {
        setDiasUteisBrutos(datasUteisData.map((d) => d.Data));
      } else if (datasUteisError) {
        console.error('Erro ao carregar dias úteis:', datasUteisError);
      }
    };

    carregarDadosIniciais();
  }, []); // Array de dependências vazio significa que roda uma vez ao montar

  // --- Geração de Dados do Gráfico ---

  // useCallback para memorizar a função 'gerarDados' e evitar recriações desnecessárias.
  const gerarDados = useCallback(async () => {
    // Condições para não gerar dados se as seleções ou dados iniciais não estiverem prontos.
    if (!maquinaSelecionada || maquinas.length === 0 || diasUteisBrutos.length === 0) {
      setDadosGrafico([]); // Limpa o gráfico se os pré-requisitos não forem atendidos
      return;
    }

    setIsLoading(true); // Ativa o estado de carregamento
    try {
      const hoje = new Date();
      // Define a data de 'hoje' para o início do dia em UTC, prevenindo desvios de fuso horário.
      hoje.setUTCHours(0, 0, 0, 0);

      let dataInicio = new Date(hoje);
      let dataFim = new Date(hoje);

      // Define o período de fim com base na seleção, usando métodos UTC para consistência.
      if (periodoSelecionado === 'quinzenal') {
        dataFim.setUTCDate(hoje.getUTCDate() + 14);
      } else if (periodoSelecionado === 'mensal') {
        dataFim.setUTCDate(hoje.getUTCDate() + 29);
      } else if (periodoSelecionado === 'bimensal') {
        dataFim.setUTCDate(hoje.getUTCDate() + 59);
      }

      // Filtra os dias úteis brutos (strings YYYY-MM-DD) para o período selecionado.
      // É crucial parsear as strings como UTC para a comparação.
      const datasUteisNoPeriodo = diasUteisBrutos.filter(dateStr => {
        const d = new Date(`${dateStr}T00:00:00Z`); // Parse como UTC
        return d >= dataInicio && d <= dataFim;
      });

      // Garante datas únicas e ordenadas para o eixo X do gráfico.
      // O Set remove duplicatas e o sort() as ordena alfabeticamente (que funciona para YYYY-MM-DD).
      const datasUnicasOrdenadas = [...new Set(datasUteisNoPeriodo)].sort();

      let jornadaTotal = 0;
      let cargaData = [];

      // Lógica para "Carga Total" vs. Máquina Individual
      if (maquinaSelecionada === 'Carga Total') {
        // Busca as jornadas de todas as máquinas envolvidas na carga total.
        const { data: maquinasJornadaData, error: maquinasJornadaError } = await supabase
          .from('Maquinas')
          .select('NomeMaquina, Jornada')
          .in('NomeMaquina', CARGA_TOTAL_MAQUINAS);

        if (maquinasJornadaError) throw maquinasJornadaError;

        // Soma as jornadas para obter a jornada total.
        jornadaTotal = maquinasJornadaData.reduce((total, maquina) => {
          return total + (maquina.Jornada || 0);
        }, 0);

        // Busca todas as horas programadas para as máquinas de carga total no período.
        const { data: totalCargaData, error: totalCargaError } = await supabase
          .from('Carga')
          .select('Data, Horas_Programadas')
          .in('Operacao', CARGA_TOTAL_MAQUINAS)
          .gte('Data', formatarDataParaQuery(dataInicio))
          .lte('Data', formatarDataParaQuery(dataFim));

        if (totalCargaError) throw totalCargaError;
        cargaData = totalCargaData;

      } else {
        // Busca a jornada da máquina individual selecionada.
        const { data: maquinaJornadaData, error: maquinaJornadaError } = await supabase
          .from('Maquinas')
          .select('Jornada')
          .eq('NomeMaquina', maquinaSelecionada);

        if (maquinaJornadaError) throw maquinaJornadaError;

        jornadaTotal = maquinaJornadaData[0]?.Jornada || 0;

        // Busca as horas programadas para a máquina individual no período.
        const { data: singleCargaData, error: singleCargaError } = await supabase
          .from('Carga')
          .select('Data, Horas_Programadas')
          .eq('Operacao', maquinaSelecionada)
          .gte('Data', formatarDataParaQuery(dataInicio))
          .lte('Data', formatarDataParaQuery(dataFim));

        if (singleCargaError) throw singleCargaError;
        cargaData = singleCargaData;
      }

      // Agrupa as horas programadas por data.
      const horasPorData = {};
      cargaData?.forEach(registro => {
        // Usa a string de data bruta do DB como chave (já é YYYY-MM-DD).
        const dataKey = registro.Data;
        horasPorData[dataKey] = (horasPorData[dataKey] || 0) + (registro.Horas_Programadas || 0);
      });

      // Formata os dados para o gráfico usando as datas únicas e ordenadas.
      const dadosFormatados = datasUnicasOrdenadas.map((dateStr) => {
        return {
          nome: formatarDataParaDisplay(dateStr), // Formata para exibição no eixo X
          horasUtilizadas: horasPorData[dateStr] || 0, // Usa a string bruta como chave para buscar as horas
          horasTotais: jornadaTotal
        };
      });

      setDadosGrafico(dadosFormatados);

    } catch (e) {
      console.error("Erro ao gerar dados do gráfico:", e);
      setDadosGrafico([]); // Limpa o gráfico em caso de erro
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  }, [maquinaSelecionada, periodoSelecionado, maquinas, diasUteisBrutos, formatarDataParaDisplay, formatarDataParaQuery]);

  // --- Efeito para Disparar a Geração de Dados ---

  // useEffect que chama 'gerarDados' sempre que as dependências mudam.
  useEffect(() => {
    // Só chama 'gerarDados' se as máquinas e os dias úteis brutos já foram carregados,
    // e se uma máquina foi selecionada.
    if (maquinas.length > 0 && diasUteisBrutos.length > 0 && maquinaSelecionada) {
      gerarDados();
    } else if (maquinaSelecionada === '') {
      setDadosGrafico([]); // Limpa o gráfico quando nenhuma máquina é selecionada
    }
  }, [maquinaSelecionada, periodoSelecionado, maquinas, diasUteisBrutos, gerarDados]); // Dependências

  // --- Handler para Exportar PDF (Funcionalidade Futura) ---

  const handleExportarPDF = () => {
    alert('Funcionalidade de exportar PDF será implementada em breve!');
  };

  // --- Renderização do Componente ---

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'background.default', color: 'text.primary' }}>
      <Box component="header" sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" align="center" fontWeight="bold">
          Dashboard de Gerenciamento da Ferramentaria
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card de Seleção de Máquina */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Seleção de Máquina" />
            <CardContent>
              <Select
                value={maquinaSelecionada}
                onChange={(e) => setMaquinaSelecionada(e.target.value)}
                displayEmpty
                fullWidth
                inputProps={{ 'aria-label': 'Selecione uma máquina' }}
              >
                <MenuItem value="" disabled>
                  Selecione uma máquina
                </MenuItem>
                <MenuItem value="Carga Total">Carga Total</MenuItem>
                <Divider />
                {maquinas.map((maq) => (
                  <MenuItem key={maq} value={maq}>
                    {maq}
                  </MenuItem>
                ))}
              </Select>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Seleção de Período */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Seleção de Período" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                <Button
                  onClick={() => setPeriodoSelecionado('quinzenal')}
                  variant={periodoSelecionado === 'quinzenal' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  Quinzenal
                </Button>
                <Button
                  onClick={() => setPeriodoSelecionado('mensal')}
                  variant={periodoSelecionado === 'mensal' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  Mensal
                </Button>
                <Button
                  onClick={() => setPeriodoSelecionado('bimensal')}
                  variant={periodoSelecionado === 'bimensal' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  Bimensal
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Exportar PDF */}
        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CardContent sx={{ width: '100%', pt: 3 }}>
              <Button onClick={handleExportarPDF} variant="contained" fullWidth>
                Exportar para PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Se uma máquina foi selecionada, mostra o gráfico ou o carregamento/mensagem */}
      {maquinaSelecionada ? (
        <Card>
          <CardHeader
            title={`Horas de Uso - Máquina ${maquinaSelecionada} (${periodoSelecionado.charAt(0).toUpperCase() + periodoSelecionado.slice(1)})`}
          />
          <CardContent>
            {isLoading ? (
              // Indicador de carregamento
              <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary">Carregando dados do gráfico...</Typography>
              </Box>
            ) : dadosGrafico.length > 0 ? (
              // Gráfico de Barras
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nome" // Usa o campo 'nome' (data formatada)
                    tickFormatter={(value) => value} // O próprio valor já está formatado
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(label) => `Data: ${label}`} // Formata o rótulo do tooltip
                    formatter={(value, name) => [
                      value,
                      name === 'horasUtilizadas' ? 'Horas Previstas' : 'Horas Totais'
                    ]}
                  />
                  <Legend
                    formatter={(value) => (
                      value === 'horasUtilizadas' ? 'Horas Previstas' : 'Horas Totais'
                    )}
                  />
                  <Bar dataKey="horasUtilizadas" fill="#8884d8" name="horasUtilizadas" />
                  <Bar dataKey="horasTotais" fill="#82ca9d" name="Horas Totais" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              // Mensagem quando não há dados para o gráfico
              <Box sx={{ height: 400, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Nenhum dado disponível para o período selecionado.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        // Mensagem inicial para selecionar uma máquina
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography align="center" color="text.secondary">
              Por favor, selecione uma máquina para visualizar os dados.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}