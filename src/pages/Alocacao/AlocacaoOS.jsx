import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Calendar, Save } from "lucide-react";
import { format, addDays, addHours } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import "./AlocacaoOS.css";

const AlocacaoOS = () => {
  const [inputValue, setInputValue] = useState("");
  const [osAtual, setOsAtual] = useState("");
  const [posicoes, setPosicoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [planejando, setPlanejando] = useState(false);
  const [diasPrimeiraOperacao, setDiasPrimeiraOperacao] = useState(1);

  // Lista de operações que devem ignorar verificações
  const operacoesIgnoradas = [
    "Trat. Termico",
    "Retifica",
    "Erosão",
    "erosao",
    "Terceiros",
    "Solda",
    "Pintura",
    "Bancada"
  ];

  // Função para verificar se uma operação deve ignorar verificações
  const deveIgnorarVerificacaoCarga = (nomeOperacao) => {
    if (!nomeOperacao) return false;
    const operacaoLower = nomeOperacao.toLowerCase();
    return operacoesIgnoradas.map(op => op.toLowerCase()).some(op => operacaoLower.includes(op));
  };

  // Função para verificar se uma operação deve ignorar dias úteis
  const deveIgnorarDiasUteis = (nomeOperacao) => {
    if (!nomeOperacao) return false;
    const operacaoLower = nomeOperacao.toLowerCase();
    return operacoesIgnoradas.map(op => op.toLowerCase()).some(op => operacaoLower.includes(op));
  };


  // Função para processar data corretamente somando 12 horas
  const processarData = (dataString) => {
    if (!dataString) return null;
    try {
      // Cria a data base e adiciona 12 horas
      const dataBase = new Date(dataString);
      const dataComHoras = addHours(dataBase, 12);
      return format(dataComHoras, "dd/MM/yyyy");
    } catch (error) {
      console.error('Erro ao processar data:', error);
      return null;
    }
  };

  const handleButtonClick = async () => {
    if (!inputValue.trim()) {
      alert("Por favor, digite uma OS válida.");
      return;
    }

    setLoading(true);
    setOsAtual(inputValue);

    const { data, error } = await supabase
      .from("Posicao")
      .select(`
        Posicao,
        Operacao1, DataLimite1, DataPlan1, Horas1, NumeroDias1,
        Operacao2, DataLimite2, DataPlan2, Horas2, NumeroDias2,
        Operacao3, DataLimite3, DataPlan3, Horas3, NumeroDias3,
        Operacao4, DataLimite4, DataPlan4, Horas4, NumeroDias4,
        Operacao5, DataLimite5, DataPlan5, Horas5, NumeroDias5,
        Operacao6, DataLimite6, DataPlan6, Horas6, NumeroDias6,
        Operacao7, DataLimite7, DataPlan7, Horas7, NumeroDias7,
        Operacao8, DataLimite8, DataPlan8, Horas8, NumeroDias8,
        Operacao9, DataLimite9, DataPlan9, Horas9, NumeroDias9,
        Operacao10, DataLimite10, DataPlan10, Horas10, NumeroDias10,
        Operacao11, DataLimite11, DataPlan11, Horas11, NumeroDias11,
        Operacao12, DataLimite12, DataPlan12, Horas12, NumeroDias12
      `)
      .eq("Os", inputValue);

    console.log('Dados lidos da OS:', {
      numeroOS: inputValue,
      dadosRecebidos: data
    });

    setLoading(false);

    if (error) {
      alert("Erro ao buscar posições.");
      return;
    }

    if (data.length === 0) {
      alert("Nenhuma posição encontrada para a OS digitada.");
    } else {
      const posicoesComOperacoes = data.map((item) => ({
        posicao: item.Posicao,
        os: inputValue,
        numeroDias: [
          item.NumeroDias1,
          item.NumeroDias2,
          item.NumeroDias3,
          item.NumeroDias4,
          item.NumeroDias5,
          item.NumeroDias6,
          item.NumeroDias7,
          item.NumeroDias8,
          item.NumeroDias9,
          item.NumeroDias10,
          item.NumeroDias11,
          item.NumeroDias12,
        ],
        operacoes: [
          { 
            nome: item.Operacao1, 
            horas: item.Horas1, 
            dataLimite: item.DataLimite1, 
            dataPlanejada: processarData(item.DataPlan1)
          },
          { 
            nome: item.Operacao2, 
            horas: item.Horas2, 
            dataLimite: item.DataLimite2, 
            dataPlanejada: processarData(item.DataPlan2)
          },
          { 
            nome: item.Operacao3, 
            horas: item.Horas3, 
            dataLimite: item.DataLimite3, 
            dataPlanejada: processarData(item.DataPlan3)
          },
          { 
            nome: item.Operacao4, 
            horas: item.Horas4, 
            dataLimite: item.DataLimite4, 
            dataPlanejada: processarData(item.DataPlan4)
          },
          { 
            nome: item.Operacao5, 
            horas: item.Horas5, 
            dataLimite: item.DataLimite5, 
            dataPlanejada: processarData(item.DataPlan5)
          },
          { 
            nome: item.Operacao6, 
            horas: item.Horas6, 
            dataLimite: item.DataLimite6, 
            dataPlanejada: processarData(item.DataPlan6)
          },
          { 
            nome: item.Operacao7, 
            horas: item.Horas7, 
            dataLimite: item.DataLimite7, 
            dataPlanejada: processarData(item.DataPlan7)
          },
          { 
            nome: item.Operacao8, 
            horas: item.Horas8, 
            dataLimite: item.DataLimite8, 
            dataPlanejada: processarData(item.DataPlan8)
          },
          { 
            nome: item.Operacao9, 
            horas: item.Horas9, 
            dataLimite: item.DataLimite9, 
            dataPlanejada: processarData(item.DataPlan9)
          },
          { 
            nome: item.Operacao10, 
            horas: item.Horas10, 
            dataLimite: item.DataLimite10, 
            dataPlanejada: processarData(item.DataPlan10)
          },
          { 
            nome: item.Operacao11, 
            horas: item.Horas11, 
            dataLimite: item.DataLimite11, 
            dataPlanejada: processarData(item.DataPlan11)
          },
          { 
            nome: item.Operacao12, 
            horas: item.Horas12, 
            dataLimite: item.DataLimite12, 
            dataPlanejada: processarData(item.DataPlan12)
          }
        ].filter((op) => op.nome !== null),
      }));

      const posicoesOrdenadas = posicoesComOperacoes.sort((a, b) => a.posicao - b.posicao);
      setPosicoes(posicoesOrdenadas);
    }

    setInputValue("");
  };

  const verificarDiaUtil = async (data) => {
    try {
      const formattedDate = format(new Date(data), "yyyy-MM-dd");
      const { data: datasUteis, error } = await supabase
        .from("DatasUteis")
        .select("DiaUtil")
        .eq("Data", formattedDate)
        .single();
    
      if (error) {
        console.error('Não foi possível verificar se é dia útil:', error);
        return false;
      }
    
      return datasUteis?.DiaUtil || false;
    } catch (err) {
      console.error('Ocorreu um erro ao processar a data:', err);
      return false;
    }
  };
  
  const encontrarProximoDiaUtil = async (data, nomeOperacao = null) => {
    // Se a operação pode funcionar em qualquer dia, retorna a própria data
    if (nomeOperacao && deveIgnorarDiasUteis(nomeOperacao)) {
      console.log(`Operação "${nomeOperacao}" pode trabalhar em qualquer dia, usando data original:`, format(data, 'dd/MM/yyyy'));
      return new Date(data);
    }

    let dataAtual = new Date(data);
    let ehDiaUtil = await verificarDiaUtil(dataAtual);
  
    while (!ehDiaUtil) {
      dataAtual = addDays(dataAtual, 1);
      ehDiaUtil = await verificarDiaUtil(dataAtual);
    }
  
    return dataAtual;
  };

  // Modifique a função calcularHorasDisponiveis para incluir logs
  const calcularHorasDisponiveis = async (data, operacao) => {
    try {
      // Se for operação que deve ignorar verificação, retorna jornada padrão
      if (deveIgnorarVerificacaoCarga(operacao)) {
        console.log('Operação ignora verificação de carga, retornando jornada padrão de 8 horas');
        return 8; // Retorna jornada padrão de 8 horas
      }

      console.log('Verificando disponibilidade para:', {
        dataRecebida: data,
        operacao: operacao,
        ignoraDiasUteis: deveIgnorarDiasUteis(operacao)
      });

      const { data: maquinasData, error: maquinasError } = await supabase
        .from("Maquinas")
        .select("Jornada")
        .eq("NomeMaquina", operacao.trim())
        .single();
  
      if (maquinasError) throw maquinasError;
  
      const { data: cargaData, error: cargaError } = await supabase
        .from("Carga")
        .select("Horas_Programadas")
        .eq("Data", data)
        .eq("Operacao", operacao.trim());
  
      if (cargaError) throw cargaError;
  
      const jornada = maquinasData?.Jornada || 0;
      const horasProgramadas = cargaData?.reduce((sum, item) => 
        sum + (item.Horas_Programadas || 0), 0) || 0;
  
      console.log('Resultado do cálculo:', {
        data,
        operacao,
        jornada,
        horasProgramadas,
        horasDisponiveis: jornada - horasProgramadas
      });
  
      return jornada - horasProgramadas;
    } catch (error) {
      console.error('Erro em calcularHorasDisponiveis:', error);
      throw error;
    }
  };

  // Nova função para encontrar a próxima data disponível com capacidade
  const encontrarProximaDataDisponivel = async (dataInicial, operacao, horasNecessarias) => {
    console.log('Buscando data disponível a partir de:', {
      dataInicial: format(dataInicial, 'dd/MM/yyyy'),
      operacao,
      horasNecessarias,
      ignoraDiasUteis: deveIgnorarDiasUteis(operacao)
    });

    let dataAtual = new Date(dataInicial);
    // Garante que a data está em UTC com 12 horas adicionadas
    dataAtual = addHours(dataAtual, 12);
    dataAtual.setUTCHours(12, 0, 0, 0);

    // Se for uma operação que deve ignorar verificação, retorna a data inicial direto
    if (deveIgnorarVerificacaoCarga(operacao)) {
      console.log('Operação ignora verificação de carga, usando data inicial:', format(dataAtual, 'dd/MM/yyyy'));
      return dataAtual;
    }

    let tentativas = 0;
    const maxTentativas = 365;

    while (tentativas < maxTentativas) {
      // Se a operação ignora dias úteis, não precisa verificar
      const precisaVerificarDiaUtil = !deveIgnorarDiasUteis(operacao);
      let ehDiaUtil = true; // Assume que é válido por padrão

      if (precisaVerificarDiaUtil) {
        ehDiaUtil = await verificarDiaUtil(dataAtual);
      }

      console.log('Verificando data:', {
        data: format(dataAtual, 'dd/MM/yyyy'),
        ehDiaUtil,
        precisaVerificarDiaUtil,
        operacao
      });

      if (ehDiaUtil) {
        try {
          const dataFormatada = format(dataAtual, 'yyyy-MM-dd');
          const horasDisponiveis = await calcularHorasDisponiveis(dataFormatada, operacao);

          console.log('Capacidade encontrada:', {
            data: format(dataAtual, 'dd/MM/yyyy'),
            horasDisponiveis,
            horasNecessarias
          });

          if (horasDisponiveis >= horasNecessarias) {
            return dataAtual;
          }
        } catch (error) {
          console.warn(`Erro ao verificar capacidade:`, error);
        }
      }

      dataAtual = addDays(dataAtual, 1);
      tentativas++;
    }

    console.warn('Não encontrou data disponível no período máximo');
    return dataInicial;
  };

  // Nova função para calcular quando uma operação será finalizada
  const calcularDataFinalizacao = async (dataInicio, operacao, horasNecessarias) => {
    let horasRestantes = horasNecessarias;
    let dataAtual = new Date(dataInicio);
    let ultimaDataTrabalho = dataAtual;
    
    // Se for uma operação que deve ignorar verificação, retorna a data inicial + dias necessários
    if (deveIgnorarVerificacaoCarga(operacao)) {
      const diasNecessarios = Math.ceil(horasNecessarias / 8); // assume jornada de 8h
      const dataFinal = addDays(dataAtual, diasNecessarios - 1); // -1 porque já conta o dia inicial
      console.log('Operação ignora verificação de carga, calculando data final:', {
        operacao,
        diasNecessarios,
        dataFinal: format(dataFinal, 'dd/MM/yyyy')
      });
      return dataFinal;
    }
    
    while (horasRestantes > 0) {
      // Se a operação ignora dias úteis, não precisa verificar
      const precisaVerificarDiaUtil = !deveIgnorarDiasUteis(operacao);
      let ehDiaUtil = true;

      if (precisaVerificarDiaUtil) {
        ehDiaUtil = await verificarDiaUtil(dataAtual);
      }
      
      if (ehDiaUtil) {
        try {
          const dataFormatada = format(dataAtual, 'yyyy-MM-dd');
          const horasDisponiveis = await calcularHorasDisponiveis(dataFormatada, operacao);
          
          if (horasDisponiveis > 0) {
            const horasAlocar = Math.min(horasRestantes, horasDisponiveis);
            horasRestantes -= horasAlocar;
            ultimaDataTrabalho = dataAtual;
          }
        } catch (error) {
          console.warn(`Erro ao calcular finalização para ${operacao}:`, error);
        }
      }
      
      dataAtual = addDays(dataAtual, 1);
    }
    
    console.log('Calculando data de finalização:', {
      dataInicio: format(dataInicio, 'dd/MM/yyyy'),
      operacao,
      horasNecessarias,
      ignoraDiasUteis: deveIgnorarDiasUteis(operacao)
    });
    
    return ultimaDataTrabalho;
  };

  const handlePlanejar = async (operacao, dataLimite, index, opIndex) => {
    if (planejando) return;
    setPlanejando(true);
    
    try {
      const datasPlanejadas = [];
      let dataUltimaFinalizacao = null;

      for (let i = 0; i < posicoes[index].operacoes.length; i++) {
        const nomeOperacao = posicoes[index].operacoes[i].nome;
        const horasNecessarias = posicoes[index].operacoes[i].horas || 0;
        
        if (!nomeOperacao || horasNecessarias <= 0) {
          datasPlanejadas.push(null);
          continue;
        }

        let dataInicioDesejada;

        if (i === 0) {
          // Primeira operação - baseada nos dias configurados pelo usuário
          const hoje = new Date();
          dataInicioDesejada = addDays(hoje, Number(diasPrimeiraOperacao));
          // Adiciona 12 horas para garantir o horário correto
          dataInicioDesejada = addHours(dataInicioDesejada, 12);
        } else {
          // Operações subsequentes - baseadas na finalização da operação anterior + dias configurados
          if (!dataUltimaFinalizacao) {
            // Se não conseguiu calcular a finalização anterior, usa a data da operação anterior + dias
            const dataOperacaoAnterior = datasPlanejadas[i - 1] ? 
              addHours(new Date(datasPlanejadas[i - 1]), 12) : 
              new Date();
            dataInicioDesejada = addDays(dataOperacaoAnterior, Number(posicoes[index].numeroDias[i - 1] || 1));
          } else {
            // Usa a data de finalização da operação anterior + dias configurados
            dataInicioDesejada = addDays(dataUltimaFinalizacao, Number(posicoes[index].numeroDias[i - 1] || 1));
          }
        }

        // Garante que é um dia útil (ou ignora se for operação especial)
        let dataInicioUtil = await encontrarProximoDiaUtil(dataInicioDesejada, nomeOperacao);
        
        // Encontra a próxima data com capacidade disponível
        const dataComCapacidade = await encontrarProximaDataDisponivel(
          dataInicioUtil, 
          nomeOperacao, 
          Math.min(horasNecessarias, 8) // Considera pelo menos algumas horas para início
        );

        const dataPlanejada = format(dataComCapacidade, 'yyyy-MM-dd');
        datasPlanejadas.push(dataPlanejada);

        // Calcula quando esta operação será finalizada para usar na próxima
        dataUltimaFinalizacao = await calcularDataFinalizacao(
          dataComCapacidade, 
          nomeOperacao, 
          horasNecessarias
        );
      }

      // Atualiza o estado com as novas datas planejadas
      setPosicoes(prevPosicoes => {
        const novasPosicoes = [...prevPosicoes];
        datasPlanejadas.forEach((data, i) => {
          if (data) {
            // Adiciona 12 horas antes de formatar
            const dataComHoras = addHours(new Date(data), 12);
            const dataFormatada = format(dataComHoras, "dd/MM/yyyy");
            novasPosicoes[index].operacoes[i].dataPlanejada = dataFormatada;
          }
        });
        return novasPosicoes;
      });

    } catch (error) {
      alert('Erro ao planejar operações: ' + error.message);
    } finally {
      setPlanejando(false);
    }
  };

  const handleSalvar = async (posicao) => {
    if (salvando) return;
    setSalvando(true);
    
    const osNumero = osAtual || posicoes[0]?.os;
    const posicaoIndex = posicoes.findIndex(p => p.posicao === posicao);
    
    if (!osNumero) {
      alert('Número da OS não encontrado!');
      setSalvando(false);
      return;
    }
  
    if (posicaoIndex === -1) {
      alert('Posição não encontrada!');
      setSalvando(false);
      return;
    }
  
    try {
      // 1. Limpa os registros antigos
      const { error: deleteError } = await supabase
        .from('Carga')
        .delete()
        .eq('Os', osNumero)
        .eq('Posicao', posicao);
  
      console.log('Deletando registros antigos:', {
        os: osNumero,
        posicao: posicao
      });
  
      if (deleteError) throw deleteError;
  
      console.log('Registros antigos deletados');
  
      const updateData = {};
      const cargaInserts = [];
  
      // 2. Processa cada operação
      for (const [index, op] of posicoes[posicaoIndex].operacoes.entries()) {
        if (!op.dataPlanejada) continue;
        
        console.log('Processando operação:', {
          index,
          operacao: op.nome,
          dataPlanejada: op.dataPlanejada,
          horasNecessarias: op.horas,
          ignoraDiasUteis: deveIgnorarDiasUteis(op.nome)
        });
  
        // Converte a data do formato DD/MM/YYYY para YYYY-MM-DD para salvar no banco
        const [dia, mes, ano] = op.dataPlanejada.split('/');
        const dataFormatadaBanco = `${ano}-${mes}-${dia}`;
  
        // Adiciona a data planejada no objeto de update usando o índice correto
        updateData[`DataPlan${index + 1}`] = dataFormatadaBanco;
  
        // Distribui as horas pelos dias disponíveis
        let horasRestantes = op.horas || 0;
        
        console.log('Data planejada original:', op.dataPlanejada);
        
        // Converte a data planejada corretamente com 12 horas adicionadas
        const [dia2, mes2, ano2] = op.dataPlanejada.split('/');
        let dataAtual = new Date(Date.UTC(ano2, mes2 - 1, dia2));
        dataAtual = addHours(dataAtual, 12);
        
        console.log('Data convertida:', {
          original: op.dataPlanejada,
          convertida: format(dataAtual, 'dd/MM/yyyy')
        });
  
        while (horasRestantes > 0) {
          const dataAtualFormatada = format(dataAtual, 'yyyy-MM-dd');
          const horasDisponiveis = await calcularHorasDisponiveis(dataAtualFormatada, op.nome);
          
          const horasAlocar = Math.min(horasRestantes, horasDisponiveis);
          
          if (horasAlocar > 0) {
            cargaInserts.push({
              Data: dataAtualFormatada,
              Operacao: op.nome,
              Os: osNumero,
              Posicao: posicao,
              Horas_Programadas: horasAlocar
            });
            horasRestantes -= horasAlocar;
          }
          
          dataAtual = addDays(dataAtual, 1);
          
          // Se a operação ignora dias úteis, não precisa verificar
          if (!deveIgnorarDiasUteis(op.nome)) {
            const ehDiaUtil = await verificarDiaUtil(dataAtual);
            if (!ehDiaUtil) {
              dataAtual = await encontrarProximoDiaUtil(dataAtual, op.nome);
            }
          }
        }
      }
  
      // 3. Atualiza a Posicao com as datas planejadas
      console.log('Atualizando Posicao:', {
        dados: updateData,
        os: osNumero,
        posicao: posicao
      });
  
      const { error: posicaoError } = await supabase
        .from('Posicao')
        .update(updateData)
        .eq('Posicao', posicao)
        .eq('Os', osNumero);
  
      if (posicaoError) throw posicaoError;
  
      // 4. Insere os novos registros na Carga
      console.log('Inserindo registros na Carga:', {
        registros: cargaInserts
      });
  
      if (cargaInserts.length > 0) {
        const { error: cargaError } = await supabase
          .from('Carga')
          .insert(cargaInserts);
  
        if (cargaError) throw cargaError;
      }
  
      alert('Dados salvos com sucesso!');
      console.log('Dados salvos com sucesso:', {
        os: osNumero,
        posicao: posicao,
        totalOperacoes: cargaInserts.length
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar os dados: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return "-";
    try {
      // Adiciona 12 horas antes de formatar
      const dataComHoras = addHours(new Date(data), 12);
      return format(dataComHoras, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Alocação de OS</h1>
        {osAtual && <div className="os-atual">OS atual: {osAtual}</div>}
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Digite a OS"
          className="search-input"
        />
        <button onClick={handleButtonClick} className="search-button">
          Buscar
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-indicator">Carregando posições...</div>
        ) : planejando ? (
          <div className="loading-indicator">Planejando operações com verificação de capacidade...</div>
        ) : posicoes.length > 0 ? (
          <table className="positions-table">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Posição</th>
                <th style={{ textAlign: "center" }}>Operação</th>
                <th style={{ textAlign: "center" }}>Horas Previstas</th>
                <th style={{ textAlign: "center" }}>Data Limite</th>
                <th style={{ textAlign: "center" }}>Data Planejada</th>
                <th style={{ textAlign: "center" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {posicoes.map((item, index) => (
                <React.Fragment key={index}>
                  {item.operacoes.map((op, opIndex) => (
                    <tr key={opIndex}>
                      {opIndex === 0 && (
                        <td rowSpan={item.operacoes.length} style={{ textAlign: "center" }}>
                          {item.posicao}
                        </td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        {op.nome}
                        {deveIgnorarVerificacaoCarga(op.nome) && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#666', 
                            display: 'block',
                            fontStyle: 'italic'
                          }}>
                            (sem verificação de carga)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{op.horas || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {op.dataLimite ? formatarData(op.dataLimite) : "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          value={op.dataPlanejada || ""}
                          onChange={(e) => {
                            const novaData = e.target.value;
                            setPosicoes(prevPosicoes => {
                              const novasPosicoes = [...prevPosicoes];
                              novasPosicoes[index].operacoes[opIndex].dataPlanejada = novaData;
                              return novasPosicoes;
                            });
                          }}
                          placeholder="Planeje aqui"
                          className="editable-input"
                        />
                      </td>
                      {opIndex === 0 && (
                        <td rowSpan={item.operacoes.length} style={{ textAlign: "center" }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="1"
                                value={diasPrimeiraOperacao}
                                onChange={(e) => setDiasPrimeiraOperacao(Number(e.target.value))}
                                style={{
                                  width: '60px',
                                  padding: '4px',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #ccc'
                                }}
                                placeholder="Dias"
                              />
                              <button
                                onClick={() => handlePlanejar(item.posicao, null, index, 0)}
                                className="icon-button edit"
                                disabled={item.operacoes.some(op => op.dataPlanejada) || salvando || planejando}
                                title="Planejar com verificação de capacidade"
                              >
                                <Calendar size={20} />
                              </button>
                              <button
                                onClick={() => handleSalvar(item.posicao)}
                                className="icon-button save"
                                disabled={salvando || planejando}
                              >
                                <Save size={20} />
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results">Nenhuma posição encontrada</p>
        )}
      </div>
    </div>
  );
};

export default AlocacaoOS;