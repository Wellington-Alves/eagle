import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Helmet } from 'react-helmet';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CartaoPercurso.css';

function CartaoPercurso() {
  const [numeroos, setNumeroos] = useState('');
  const [posicoes, setPosicoes] = useState([]);
  const [osData, setOsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const TOTAL_OPERACOES = 10;

  // ------------------ Impressão em nova janela ------------------
  const handlePrintNovaJanela = () => {
    const conteudo = document.getElementById('print-content');
    if (!conteudo) {
      alert('Conteúdo não encontrado para impressão');
      return;
    }

    const novaJanela = window.open('', '', 'width=1200,height=800');

    novaJanela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cartão de Percurso - OS ${numeroos}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }

            @page {
              size: portrait;
              margin: 15mm;
            }

            body {
              font-family: Arial, sans-serif;
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10mm;
            }

            td, th {
              border: 1px solid black;
              padding: 5mm;
              text-align: center;
            }

            img { max-height: 15mm; display: block; margin: 0 auto; }

            .resultado-grade { margin-bottom: 5mm; page-break-inside: avoid; }

            .processos-grid {
              display: grid;
              grid-template-columns: 60pt repeat(10, 1fr);
              gap: 0;
              background: white;
            }

            .posicao-celula {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 15mm;
              border: 1px solid black;
              background: #f0f0f0 !important;
              font-weight: bold;
              padding: 2mm;
            }

            .operacao-data {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              min-height: 15mm;
              padding: 2mm;
              border: 1px solid black;
              background: white !important;
            }

            .operacao-data[style*="background-color: rgb(255, 235, 238)"],
            .operacao-data[style*="backgroundColor: #ffebee"] {
              background: #ffebee !important;
            }

            .operacao { font-weight: bold; font-size: 10pt; margin-bottom: 2px; }
            .data-limite { font-size: 9pt; margin-bottom: 2px; }
            .etapa { font-size: 9pt; padding: 1mm 2mm; }

            @media print {
              .posicao-celula { background: #f0f0f0 !important; }
            }
          </style>
        </head>
        <body>
          ${conteudo.innerHTML}
        </body>
      </html>
    `);

    novaJanela.document.close();
    novaJanela.focus();

    setTimeout(() => {
      novaJanela.print();
      setTimeout(() => novaJanela.close(), 500);
    }, 500);
  };

  // ------------------ Impressão original ------------------
  const handlePrint = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  // ------------------ Buscar dados ------------------
  const getLogoCliente = (cliente) => (cliente ? `/${cliente.toUpperCase()}.png` : null);

  const CelulaPosicao = ({ numero, quantidade }) => (
    <div className="posicao-celula" style={{ border: 'none' }}>
      <div className="posicao-label">Posição</div>
      <div className="posicao-numero">
        {numero}
        {quantidade && <div className="posicao-quantidade">({quantidade}x)</div>}
      </div>
    </div>
  );

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    date.setDate(date.getDate() + 1);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const abreviarEtapa = (etapa) => {
    const etapas = {
      'Aguardando Material': 'Mat. Prima',
      'Em Andamento': 'Em Proc.',
      'Concluída': 'Concl.',
      'Cancelada': 'Canc.',
    };
    return etapas[etapa] || etapa;
  };

  const abreviarOperacao = (operacao) => {
    const operacoes = {
      'Torno Conv.': 'Tn. Conv.',
      'Torno CNC': 'Tn. CNC',
      'Terceiros': "III's",
      'Trat. Termico': 'T.T',
    };
    return operacoes[operacao] || operacao;
  };

  const estaAtrasado = (dataLimite, etapa) => {
    if (!dataLimite || !etapa || etapa === 'Concluída' || etapa === 'Cancelada') return false;
    const hoje = new Date();
    const dataLimiteObj = new Date(dataLimite);
    hoje.setHours(0, 0, 0, 0);
    dataLimiteObj.setHours(0, 0, 0, 0);
    return dataLimiteObj < hoje;
  };

  const buscaros = async () => {
    if (!numeroos.trim()) {
      alert('Por favor, insira um número de OS válido');
      return;
    }

    setLoading(true);
    try {
      const { data: osData, error: osError } = await supabase
        .from('OrdemServico')
        .select('NumeroOsCliente, Desenho, DataEntrega, Cliente, Coordenador')
        .eq('Os', numeroos)
        .single();

      if (osError) throw osError;
      setOsData(osData);

      const campos = Array.from({ length: TOTAL_OPERACOES }, (_, i) => [
        `Operacao${i + 1}`,
        `DataPlan${i + 1}`,
        `Etapas${i + 1}`,
      ]).flat();

      const { data: posdata, error: poserror } = await supabase
        .from('Posicao')
        .select(['Posicao', 'QuantidadePecas', ...campos].join(', '))
        .eq('Os', numeroos)
        .order('Posicao', { ascending: true });

      if (poserror) throw poserror;
      setPosicoes(posdata || []);
    } catch (error) {
      alert(`Erro ao buscar dados: ${error.message}`);
      setPosicoes([]);
      setOsData(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Gerar PDF em retrato ------------------
  const gerarPDF = async () => {
    const elemento = document.getElementById('print-content');
    if (!elemento) {
      alert('Não foi encontrado o conteúdo para gerar o PDF');
      return;
    }

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        windowWidth: elemento.scrollWidth,
        windowHeight: elemento.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait', // AGORA RETRATO
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`CartaoPercurso_${numeroos || 'OS'}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF');
    }
  };

  // ------------------ JSX ------------------
  return (
    <div className="app-wrapper">
      <Helmet>
        <title>Cartão de Percurso - {numeroos || 'Ordem de Serviço'}</title>
      </Helmet>

      <div className="no-print">
        <h1>Cartão de Percurso</h1>
        <div className="search-panel">
          <label>Número da OS</label>
          <input
            type="text"
            value={numeroos}
            onChange={(e) => setNumeroos(e.target.value)}
          />
          <button onClick={buscaros}>{loading ? 'Carregando...' : 'Buscar'}</button>
        </div>
      </div>

      <div id="print-content" className="print-content">
        {!loading && numeroos && posicoes.length > 0 && osData && (
          <div>
            {/* Cabeçalho */}
            <table className="header-container">
              <tbody>
                <tr>
                  <td><img src="/Eagle.jpg" alt="Eagle Logo" /></td>
                  <td><strong>Coordenador: {osData.Coordenador || 'N/A'}</strong></td>
                  <td>{osData.NumeroOsCliente && <span>OS Cliente: {osData.NumeroOsCliente}</span>}</td>
                </tr>
                <tr>
                  <td>{osData.Cliente && <img src={getLogoCliente(osData.Cliente)} alt="Logo Cliente" />}</td>
                  <td><strong>{osData.Desenho || 'N/A'}</strong></td>
                  <td><strong>Prazo: {osData.DataEntrega ? formatarData(osData.DataEntrega) : 'N/A'}</strong></td>
                  <td><strong>OS: {numeroos}</strong></td>
                </tr>
              </tbody>
            </table>

            {/* Lista de posições */}
            {posicoes.map((pos, idx) => {
              const temOperacao = Array.from({ length: TOTAL_OPERACOES }, (_, i) => pos[`Operacao${i + 1}`]).some(Boolean);
              if (!temOperacao) return null;

              return (
                <div key={idx} className="resultado-grade">
                  <div className="processos-grid">
                    <CelulaPosicao numero={pos.Posicao} quantidade={pos.QuantidadePecas} />
                    {Array.from({ length: TOTAL_OPERACOES }, (_, i) => {
                      const operacao = pos[`Operacao${i + 1}`];
                      if (!operacao) return null;

                      const dataPlan = pos[`DataPlan${i + 1}`] ? formatarData(pos[`DataPlan${i + 1}`]) : '';
                      const etapa = pos[`Etapas${i + 1}`] ? abreviarEtapa(pos[`Etapas${i + 1}`]) : '';
                      const atrasado = estaAtrasado(pos[`DataPlan${i + 1}`], pos[`Etapas${i + 1}`]);

                      return (
                        <div
                          key={i}
                          className="operacao-data"
                          style={{ backgroundColor: atrasado ? '#ffebee' : 'white' }}
                        >
                          <div className="operacao">{abreviarOperacao(operacao)}</div>
                          <div className="data-limite">{dataPlan}</div>
                          <div className="etapa">{etapa}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && posicoes.length > 0 && (
        <>
          <button onClick={handlePrintNovaJanela}>🖨️ Imprimir via Nova Janela</button>
          <button onClick={handlePrint}>Imprimir Lista Completa</button>
          <button onClick={() => gerarPDF()}>Gerar PDF (Retrato)</button>
        </>
      )}
    </div>
  );
}

export default CartaoPercurso;
