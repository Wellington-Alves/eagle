import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './CadastroPosicoes.module.css';
import { supabase } from '../../supabaseClient';
import Quadro1 from './Quadro1.jsx';
import Quadro2 from './Quadro2.jsx';
import Quadro3 from './Quadro3.jsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTrash } from '@fortawesome/free-solid-svg-icons';

const CadastroPosicoes = () => {
  const [os, setOs] = useState('');
  const [posicao, setPosicao] = useState('');
  const [tipo, setTipo] = useState('');
  const [beneficiado, setBeneficiado] = useState(false);
  const [bitola, setBitola] = useState('');
  const [formato, setFormato] = useState('');
  const [largura, setLargura] = useState('');
  const [comprimento, setComprimento] = useState('');
  const [material, setMaterial] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [cliente, setCliente] = useState('');
  const [osError, setOsError] = useState('');
  const [quantidadePecasLocal, setQuantidadePecasLocal] = useState('');
  const [quantidadeMaterialLocal, setQuantidadeMaterialLocal] = useState('');
  const [quantidadeError, setQuantidadeError] = useState('');
  const [isSalvando, setIsSalvando] = useState(false);
  const [isLoadingProcesso, setIsLoadingProcesso] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusPosicao, setStatusPosicao] = useState('');

  const [linhasQuadro3, setLinhasQuadro3] = useState(
    Array.from({ length: 12 }, () => ({
      maquina: '',
      horas: '',
      statusPosicao: '',
      etapa: '',
    }))
  );

  const prevOsRef = useRef();
  const prevPosicaoRef = useRef();

  const converterParaNumero = (valor) => {
    if (valor === '' || isNaN(valor)) return null;
    return parseFloat(valor);
  };

  const isNumeroValido = (valor) => !isNaN(valor) && valor !== '';

  const buscarOrdemServico = async (numeroOS) => {
    if (!numeroOS) return;

    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('DataEntrega, Cliente')
        .eq('Os', numeroOS)
        .single();

      if (error) {
        setOsError('O.S não encontrada.');
        setDataEntrega('');
        setCliente('');
        return;
      }

      const dataObj = new Date(data.DataEntrega + 'T00:00:00');
      const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      setDataEntrega(dataFormatada || 'Nenhuma data encontrada.');
      setCliente(data.Cliente || 'Nenhum cliente encontrado.');
      setOsError('');
    } catch (error) {
      setOsError('Erro ao buscar O.S. Tente novamente.');
    }
  };

  const buscarPosicao = useCallback(async () => {
    if (!os || !posicao) return;
    setIsLoadingProcesso(true);

    try {
      const { data: posicaoData, error: posicaoError } = await supabase
        .from('Posicao')
        .select('*, StatusPosicao') // Inclua o campo StatusPosicao na consulta
        .eq('Os', os)
        .eq('Posicao', posicao)
        .single();

      if (posicaoError && posicaoError.code === 'PGRST116') {
        // Posição não encontrada - é uma nova posição
        setTipo('');
        setFormato('');
        setBeneficiado(false);
        setBitola('');
        setLargura('');
        setComprimento('');
        setMaterial('');
        setQuantidadePecasLocal('');
        setQuantidadeMaterialLocal('');
        setLinhasQuadro3(Array.from({ length: 12 }, () => ({
          maquina: '',
          horas: '',
          statusPosicao: '',
          etapa: ''
        })));
        setStatusPosicao(''); // Limpa o status da posição
        return;
      }

      if (posicaoError) {
        toast.error('Erro ao buscar posição.');
        return;
      }

      if (posicaoData) {
        setTipo(posicaoData.Tipo || '');  
        setFormato(posicaoData.Formato || '');
        setBeneficiado(posicaoData.Beneficiado || false);
        setBitola(posicaoData.Bitola?.toString() || '');
        setLargura(posicaoData.Largura?.toString() || '');
        setComprimento(posicaoData.Comprimento?.toString() || '');
        setMaterial(posicaoData.Material || '');
        setQuantidadePecasLocal(posicaoData.QuantidadePecas?.toString() || '');
        setQuantidadeMaterialLocal(posicaoData.QuantidadeMaterial?.toString() || '');

        const novasLinhas = Array.from({ length: 12 }, (_, index) => ({
          maquina: posicaoData[`Operacao${index + 1}`] || '',
          horas: posicaoData[`Horas${index + 1}`] || '',
          statusPosicao: posicaoData[`Etapas${index + 1}`] || '',
          etapa: '', // Use se necessário
        }));
        setLinhasQuadro3(novasLinhas);

        // Atualize o estado com o StatusPosicao
        setStatusPosicao(posicaoData.StatusPosicao || 'Nenhum status encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar a posição.');
    } finally {
      setIsLoadingProcesso(false);
    }
  }, [os, posicao]);

  const handleBlur = (campo) => {
    if (campo === 'os') buscarOrdemServico(os);
    if (campo === 'posicao') buscarPosicao();
  };

  const calcularStatusPosicao = (linhas) => {
    // Log de cada operação e seu status
    console.log('\nOperações:');
    linhas.forEach((linha, index) => {
      if (linha.maquina || linha.statusPosicao) {
        console.log(`Operação ${index + 1}:`, {
          'Máquina': linha.maquina || 'Não definida',
          'Status': linha.statusPosicao || 'Não iniciada',
          'Horas': linha.horas || '0'
        });
      }
    });
  
    const totalHoras = linhas.reduce((acc, linha) => acc + (parseFloat(linha.horas) || 0), 0);
    const horasConcluidas = linhas.reduce((acc, linha) => {
      if (linha.statusPosicao === 'Concluída' || linha.statusPosicao === 'Concluida') {
        return acc + (parseFloat(linha.horas) || 0);
      }
      return acc;
    }, 0);
  
    console.log('\nResumo do cálculo:');
    console.log('Total de horas:', totalHoras);
    console.log('Horas concluídas:', horasConcluidas);
  
    let status = '0%';
    if (totalHoras > 0) {
      const porcentagem = Math.round((horasConcluidas / totalHoras) * 100);
      status = `${porcentagem}%`;
    }
  
    console.log('Status da posição calculado:', status);
    console.log('----------------------------------------');
    
    return status;
  };

  const handleSalvar = async () => {
    if (!os || !posicao) return toast.error('OS e Posição são obrigatórios.');
    if (!isNumeroValido(quantidadePecasLocal)) return toast.error('Quantidade inválida.');

    setIsSalvando(true);
    try {
      const { data: posicaoExistente, error: buscaError } = await supabase
        .from('Posicao')
        .select('PosicaoId')
        .eq('Os', os)
        .eq('Posicao', posicao)
        .single();

      if (buscaError && buscaError.code !== 'PGRST116') {
        return toast.error('Erro ao verificar posição.');
      }

      // Usar a função calcularStatusPosicao
      const statusPosicao = calcularStatusPosicao(linhasQuadro3);

      const dadosPosicao = {
        Os: os,
        Posicao: posicao,
        QuantidadePecas: converterParaNumero(quantidadePecasLocal),
        QuantidadeMaterial: converterParaNumero(quantidadeMaterialLocal),
        Tipo: tipo,
        Formato: formato,
        Material: material,
        Beneficiado: beneficiado,
        Bitola: bitola || null,
        Largura: converterParaNumero(largura),
        Comprimento: converterParaNumero(comprimento),
        StatusPosicao: statusPosicao, // Adicionando o StatusPosicao calculado
        ...linhasQuadro3.reduce((acc, linha, index) => {
          acc[`Operacao${index + 1}`] = linha.maquina || null;
          acc[`Horas${index + 1}`] = linha.horas || null;
          acc[`Etapas${index + 1}`] = linha.statusPosicao || null;
          acc[`Obs${index + 1}`] = linha.observacao || null;
          return acc;
        }, {}),
      };

      if (posicaoExistente) {
        await supabase.from('Posicao').update(dadosPosicao).eq('PosicaoId', posicaoExistente.PosicaoId);
      } else {
        await supabase.from('Posicao').insert([dadosPosicao]);
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar posição:', error); // Log de erro
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSalvando(false);
    }
  };

  const deletarPosicao = async () => {
    if (!os || !posicao) return toast.error('Informe OS e Posição.');

    try {
      await supabase.from('Posicao').delete().eq('Os', os).eq('Posicao', posicao);
      toast.success('Posição deletada com sucesso!');

      setOs('');
      setPosicao('');
      setTipo('');
      setBeneficiado(false);
      setBitola('');
      setFormato('');
      setLargura('');
      setComprimento('');
      setMaterial('');
      setQuantidadePecasLocal('');
      setQuantidadeMaterialLocal('');
      setLinhasQuadro3(Array.from({ length: 12 }, () => ({ maquina: '', horas: '', statusPosicao: '', etapa: '' })));
    } catch (error) {
      toast.error('Erro ao deletar.');
    } finally {
      setMostrarConfirmacao(false);
    }
  };

  const handleLinhaChange = (index, campo, valor) => {
    const novasLinhas = [...linhasQuadro3];
    novasLinhas[index][campo] = valor;
    setLinhasQuadro3(novasLinhas);
  
    // Recalcula o status quando houver mudança no statusPosicao
    if (campo === 'statusPosicao') {
      const novoStatus = calcularStatusPosicao(novasLinhas);
      setStatusPosicao(novoStatus);
    }
  };

  useEffect(() => {
    if (
      os &&
      posicao &&
      (prevOsRef.current !== os || prevPosicaoRef.current !== posicao)
    ) {
      const timeoutId = setTimeout(() => buscarPosicao(), 1000);
      return () => clearTimeout(timeoutId);
    }
    prevOsRef.current = os;
    prevPosicaoRef.current = posicao;
  }, [os, posicao]);

  return (
    <div className={styles.container}>
      <Quadro1
        os={os}
        setOs={setOs}
        dataEntrega={dataEntrega}
        cliente={cliente}
        posicao={posicao}
        setPosicao={setPosicao}
        quantidadePecas={quantidadePecasLocal}
        setQuantidadePecas={setQuantidadePecasLocal}
        osError={osError}
        quantidadeError={quantidadeError}
        loading={loading}
        handleBlur={handleBlur}
      />

      <Quadro2
        quantidadeMaterial={quantidadeMaterialLocal}
        setQuantidadeMaterial={setQuantidadeMaterialLocal}
        tipo={tipo}
        setTipo={setTipo}
        formato={formato}
        setFormato={setFormato}
        material={material}
        setMaterial={setMaterial}
        beneficiado={beneficiado}
        setBeneficiado={setBeneficiado}
        bitola={bitola}
        setBitola={setBitola}
        largura={largura}
        setLargura={setLargura}
        comprimento={comprimento}
        setComprimento={setComprimento}
      />

      <Quadro3
        linhas={linhasQuadro3}
        handleLinhaChange={handleLinhaChange}
        isLoadingProcesso={isLoadingProcesso}
      />

      {/* Exiba o StatusPosicao */}
      <div className={styles['status-posicao']}>
        <strong>Status da Posição:</strong> {statusPosicao}
      </div>

      {/* Botões Salvar e Deletar */}
      <div className={styles['botoes-container']}>
        <button
          onClick={handleSalvar}
          disabled={isSalvando || !os || !posicao}
          className={styles['botao-salvar']}
        >
          <FontAwesomeIcon icon={faSave} /> {isSalvando ? 'Salvando...' : 'Salvar'}
        </button>
        
        <button
          onClick={() => setMostrarConfirmacao(true)}
          disabled={!os || !posicao}
          className={styles['botao-deletar']}
        >
          <FontAwesomeIcon icon={faTrash} /> Deletar
        </button>
      </div>

      {mostrarConfirmacao && (
        <div className={styles.modal}>
          <div className={styles['modal-conteudo']}>
            <p>Tem certeza que deseja deletar esta posição?</p>
            <button onClick={deletarPosicao}>Sim, deletar</button>
            <button onClick={() => setMostrarConfirmacao(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default CadastroPosicoes;