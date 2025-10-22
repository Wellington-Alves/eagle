import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './FichaEnvio.css';

const FichaEnvio = () => {
  const [dados, setDados] = useState({
    posicao: '',
    desenho: '',
    cliente: '',
    qtde: '',
    volume: '',
    coordenador: '',
    osCliente: '',
    osInterna: '',
    data: new Date().toLocaleDateString('pt-BR')
  });

  const [etiquetasPendentes, setEtiquetasPendentes] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});

  // Função para buscar as posições na tabela "Posicao" pela OS
  const buscarPosicoes = async (osInterna) => {
    const { data, error } = await supabase
      .from('Posicao')
      // buscar também QuantidadePecas para preencher qtde nas etiquetas
      .select('Posicao, QuantidadePecas')
      .eq('Os', osInterna);

    if (error) {
      console.error('Erro ao buscar posições:', error);
      return [];
    }

    // retorna array de objetos: { Posicao, QuantidadePecas }
    return data.map((item) => ({ Posicao: item.Posicao, QuantidadePecas: item.QuantidadePecas }));
  };

  // Função para buscar o desenho na tabela OrdemServico pela OS interna
  const buscarDesenho = async (osInterna) => {
    if (!osInterna) return null;
    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('Desenho')
        .eq('Os', osInterna)
        .limit(1)
        .single();

      if (error) {
        console.warn('buscarDesenho: erro ao buscar desenho', error);
        return null;
      }

      // retorna o valor da coluna Desenho se existir
      return data && data.Desenho ? data.Desenho : null;
    } catch (err) {
      console.error('buscarDesenho: exceção', err);
      return null;
    }
  };

  // Função para buscar o cliente na tabela OrdemServico pela OS interna
  const buscarCliente = async (osInterna) => {
    if (!osInterna) return null;
    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('Cliente')
        .eq('Os', osInterna)
        .limit(1)
        .single();

      if (error) {
        console.warn('buscarCliente: erro ao buscar cliente', error);
        return null;
      }

      return data && data.Cliente ? data.Cliente : null;
    } catch (err) {
      console.error('buscarCliente: exceção', err);
      return null;
    }
  };

  // Função para buscar o coordenador na tabela OrdemServico pela OS interna
  const buscarCoordenador = async (osInterna) => {
    if (!osInterna) return null;
    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('Coordenador')
        .eq('Os', osInterna)
        .limit(1)
        .single();

      if (error) {
        console.warn('buscarCoordenador: erro ao buscar coordenador', error);
        return null;
      }

      return data && data.Coordenador ? data.Coordenador : null;
    } catch (err) {
      console.error('buscarCoordenador: exceção', err);
      return null;
    }
  };

  // Função para buscar o número da OS cliente (NumeroOsCliente) na tabela OrdemServico pela OS interna
  const buscarOsCliente = async (osInterna) => {
    if (!osInterna) return null;
    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('NumeroOsCliente')
        .eq('Os', osInterna)
        .limit(1)
        .single();

      if (error) {
        console.warn('buscarOsCliente: erro ao buscar NumeroOsCliente', error);
        return null;
      }

      return data && data.NumeroOsCliente ? data.NumeroOsCliente : null;
    } catch (err) {
      console.error('buscarOsCliente: exceção', err);
      return null;
    }
  };

  // Função para expandir posições (exemplo: "1-5" vira ["1", "2", "3", "4", "5"])
  const expandirPosicoes = (posicaoInput) => {
    const posicoes = [];
    const itens = posicaoInput.split(',').map(item => item.trim());
    
    itens.forEach(item => {
      if (item.includes('-')) {
        const [inicio, fim] = item.split('-').map(num => parseInt(num.trim()));
        if (!isNaN(inicio) && !isNaN(fim)) {
          for (let i = inicio; i <= fim; i++) {
            posicoes.push(i.toString());
          }
        }
      } else {
        posicoes.push(item);
      }
    });
    
    return posicoes.filter(Boolean);
  };

  // Função para gerar etiquetas com as posições encontradas
  const importarPosicoes = async () => {
    if (!dados.osInterna.trim()) {
      alert('Por favor, preencha a OS Interna.');
      return;
    }

    const posicoes = await buscarPosicoes(dados.osInterna);
    if (posicoes.length === 0) {
      alert('Nenhuma posição encontrada para esta OS.');
      return [];
    }

    // Gerar etiquetas com as posições encontradas
    const osInternaValor = (dados.osInterna || '').toString().trim();
    const osClienteValor = (dados.osCliente || '').toString().trim();

    // determina o desenho: usa o preenchido no formulário ou busca na tabela OrdemServico
    let desenhoValor = (dados.desenho || '').toString().trim();
    if (!desenhoValor) {
      const busc = await buscarDesenho(osInternaValor);
      if (busc) {
        desenhoValor = busc.toString();
      } else {
        console.info('importarPosicoes: desenho não encontrado na tabela OrdemServico para OS', osInternaValor);
      }
    }

    // determina o cliente: usa o preenchido no formulário ou busca na tabela OrdemServico
    let clienteValor = (dados.cliente || '').toString().trim();
    if (!clienteValor) {
      const buscCli = await buscarCliente(osInternaValor);
      if (buscCli) {
        clienteValor = buscCli.toString();
      } else {
        console.info('importarPosicoes: cliente não encontrado na tabela OrdemServico para OS', osInternaValor);
      }
    }

    // determina o osCliente (número da OS do cliente): usa o preenchido no formulário ou busca na tabela OrdemServico
    let osClienteValorFinal = osClienteValor;
    if (!osClienteValorFinal) {
      const buscOsCli = await buscarOsCliente(osInternaValor);
      if (buscOsCli) {
        osClienteValorFinal = buscOsCli.toString();
      } else {
        console.info('importarPosicoes: NumeroOsCliente não encontrado na tabela OrdemServico para OS', osInternaValor);
      }
    }

    // determina o coordenador: usa o preenchido no formulário ou busca na tabela OrdemServico
    let coordenadorValor = (dados.coordenador || '').toString().trim();
    if (!coordenadorValor) {
      const buscCoord = await buscarCoordenador(osInternaValor);
      if (buscCoord) {
        coordenadorValor = buscCoord.toString();
      } else {
        console.info('importarPosicoes: coordenador não encontrado na tabela OrdemServico para OS', osInternaValor);
      }
    }

    const novasEtiquetas = posicoes.map((p) => {
      const pos = p.Posicao || p;
      const quantidadePecas = p.QuantidadePecas != null ? p.QuantidadePecas : null;
      return {
        // garante explicitamente que os campos de OS/cliente/desenho sejam preservados
        ...dados,
        posicao: pos,
        osInterna: osInternaValor,
  osCliente: osClienteValorFinal,
        desenho: desenhoValor,
        cliente: clienteValor,
        // usa a quantidade da posição se disponível, senão fallback para o campo do formulário
        qtde: quantidadePecas != null ? quantidadePecas.toString() : (dados.qtde || ''),
        coordenador: coordenadorValor
      };
    });

    setEtiquetasPendentes((prev) => [...prev, ...novasEtiquetas]);
    // loga e RETORNA as etiquetas geradas para quem chamar a função
    console.log('importarPosicoes -> novasEtiquetas:', novasEtiquetas);
    return novasEtiquetas;
  };

  // Função para adicionar etiquetas a partir da entrada
  const adicionarEtiquetas = () => {
    let novasEtiquetas = [];

    // Se tiver posição, processa as posições expandidas
    if (dados.posicao.trim()) {
      const posicoes = expandirPosicoes(dados.posicao);
      novasEtiquetas = posicoes.map((pos) => ({ ...dados, posicao: pos }));
    } 
    // Se tiver desenho e OS, processa múltiplos desenhos
    else if (dados.osInterna.trim()) {
      const osList = dados.osInterna.split(',').map((o) => o.trim()).filter(Boolean);
      
      // Cria uma ficha para cada OS, mantendo os outros dados iguais
      novasEtiquetas = osList.map((osInterna) => ({
        ...dados,
        osInterna
      }));
    }
    // Se nenhum dos casos acima (por exemplo: só quer adicionar uma ficha única)
    else {
      novasEtiquetas = [{ ...dados }];
    }

    if (novasEtiquetas.length === 0) {
      alert('Por favor, preencha pelo menos o número da OS.');
      return;
    }

    setEtiquetasPendentes((prev) => [...prev, ...novasEtiquetas]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados({ ...dados, [name]: value });
  };

  const handlePrint = () => {
    window.print();
  };

  const limparFila = () => {
    setEtiquetasPendentes([]);
  };

  const deletarEtiqueta = (index) => {
    const novasEtiquetas = etiquetasPendentes.filter((_, i) => i !== index);
    setEtiquetasPendentes(novasEtiquetas);
  };

  const iniciarEdicao = (index) => {
    setEditandoIndex(index);
    setDadosEdicao({ ...etiquetasPendentes[index] });
  };

  const cancelarEdicao = () => {
    setEditandoIndex(null);
    setDadosEdicao({});
  };

  const salvarEdicao = () => {
    const novasEtiquetas = [...etiquetasPendentes];
    novasEtiquetas[editandoIndex] = { ...dadosEdicao };
    setEtiquetasPendentes(novasEtiquetas);
    setEditandoIndex(null);
    setDadosEdicao({});
  };

  const handleChangeEdicao = (e) => {
    const { name, value } = e.target;
    setDadosEdicao({ ...dadosEdicao, [name]: value });
  };

  return (
    <div className="ficha-envio-container">
      {/* Formulário */}
      <div className="formulario">
        <h2>Ficha de Envio</h2>
        {[{ label: 'OS', name: 'osInterna' }, 
          { label: 'Posição', name: 'posicao' },
          { label: 'Desenho', name: 'desenho' },
          { label: 'Cliente', name: 'cliente' },
          { label: 'Qtde', name: 'qtde' },
          { label: 'Volume', name: 'volume' },
          { label: 'Coordenador', name: 'coordenador' },
          { label: 'O.S Cliente', name: 'osCliente' },
          { label: 'Data', name: 'data' }]
          .map((field) => (
            <div className="form-group" key={field.name}>
              <label>{field.label}:</label>
              <input
                type="text"
                name={field.name}
                value={dados[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}

        <button onClick={importarPosicoes} className="print-button">
          Importar
        </button>

        <button onClick={adicionarEtiquetas} className="print-button">
          Adicionar à fila ({etiquetasPendentes.length})
        </button>

        {etiquetasPendentes.length > 0 && (
          <>
            <button onClick={handlePrint} className="print-button">
              Imprimir Etiquetas ({etiquetasPendentes.length})
            </button>
            
            <button onClick={limparFila} className="print-button" style={{backgroundColor: '#dc3545'}}>
              Limpar Fila
            </button>
          </>
        )}
      </div>

      {/* Etiquetas acumuladas */}
      <div className="etiquetas-container">
        {etiquetasPendentes.map((etiqueta, idx) => (
          <div key={idx} className="etiqueta-wrapper">
            {editandoIndex === idx ? (
              <div className="etiqueta-edicao">
                <h3>Editando Etiqueta {idx + 1}</h3>
                {[{ label: 'OS', name: 'osInterna' }, 
                  { label: 'Posição', name: 'posicao' },
                  { label: 'Desenho', name: 'desenho' },
                  { label: 'Cliente', name: 'cliente' },
                  { label: 'Qtde', name: 'qtde' },
                  { label: 'Volume', name: 'volume' },
                  { label: 'Coordenador', name: 'coordenador' },
                  { label: 'O.S Cliente', name: 'osCliente' },
                  { label: 'Data', name: 'data' }]
                  .map((field) => (
                    <div className="form-group-small" key={field.name}>
                      <label>{field.label}:</label>
                      <input
                        type="text"
                        name={field.name}
                        value={dadosEdicao[field.name] || ''}
                        onChange={handleChangeEdicao}
                      />
                    </div>
                  ))}
                <div className="botoes-edicao">
                  <button onClick={salvarEdicao} className="botao-salvar">
                    Salvar
                  </button>
                  <button onClick={cancelarEdicao} className="botao-cancelar">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Etiqueta {...etiqueta} />
                <div className="botoes-etiqueta">
                  <button 
                    onClick={() => iniciarEdicao(idx)} 
                    className="botao-editar"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deletarEtiqueta(idx)} 
                    className="botao-deletar"
                  >
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Etiqueta = ({
  posicao,
  desenho,
  cliente,
  qtde,
  volume,
  coordenador,
  osCliente,
  osInterna,
  data
}) => (
  <div className="ficha-impressao">
    <div className="cabecalho">
      <div className="logo-container">
        <img src="/Eagle.jpg" alt="Logo" className="logo" />
      </div>
      <div className="os-aprovado-container">
        <div className="os-interna">OS: {osInterna}</div>
        <div className="aprovado">APROVADO</div>
      </div>
    </div>
    
    {/* Linha do responsável MBB */}
    {cliente && cliente.toUpperCase() === 'MBB' && (
      <div><span style={{ fontWeight: 'bold' }}>Resp.</span> Luis Henrique RE 282243-1</div>
    )}
    
    <div><span style={{ fontWeight: 'bold' }}>Posição:</span> {posicao}</div>
    <div><span style={{ fontWeight: 'bold' }}>Desenho:</span> {desenho}</div>
  <div><span style={{ fontWeight: 'bold' }}>Cliente:</span> {cliente}</div>
    <div className="qtde-volume">
      <span><span style={{ fontWeight: 'bold' }}>Qtde:</span> {qtde}</span>
      {volume && <span className="separador-volume"><span style={{ fontWeight: 'bold' }}>Volume:</span> {volume}</span>}
    </div>
    <div><span style={{ fontWeight: 'bold' }}>Coordenador:</span> {coordenador}</div>
  <div className="cliente-field"><span style={{ fontWeight: 'bold' }}>O.S Cliente:</span> {osCliente}</div>
    <div className="assinatura-data-container">
      <div className="data"><span style={{ fontWeight: 'bold' }}>Data:</span> {data}</div>
      <div className="assinar"><span style={{ fontWeight: 'bold' }}>Assinatura:</span></div>
    </div>
  </div>
);

export default FichaEnvio;