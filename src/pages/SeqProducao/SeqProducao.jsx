import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './SeqProducao.module.css';
import { FaClock, FaCheckCircle, FaPauseCircle, FaQuestionCircle, FaBoxOpen } from 'react-icons/fa';

const maquinas = [
  'Torno CNC',
  'Torno Conv.',
  'Fresa',
  'Romi 560',
  'Vekker',
  'V400',
];

const statusMap = {
  'Aguardando': { class: styles.statusAguardando, icon: <FaPauseCircle />, color: '#ff0000' },
  'Aguardando Material': { class: styles.statusAguardandoMaterial, icon: <FaBoxOpen />, color: '#ff8c00' },
  'Em Andamento': { class: styles.statusAndamento, icon: <FaClock />, color: '#007bff' },
  'Concluída': { class: styles.statusConcluida, icon: <FaCheckCircle />, color: '#28a745' },
  'default': { class: styles.statusDefault, icon: <FaQuestionCircle />, color: '#6c757d' }
};

function SeqProducao() {
  const [maquinaOs, setMaquinaOs] = useState({});
  const [mostrarHoras, setMostrarHoras] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const etapas = Array.from({ length: 12 }, (_, i) => i + 1);
        const osPorMaquina = {};

        maquinas.forEach(m => osPorMaquina[m] = []);

        for (const etapa of etapas) {
          const etapaColuna = `Etapas${etapa}`;
          const operacaoColuna = `Operacao${etapa}`;
          const horasColuna = `Horas${etapa}`;
          const dataLimiteColuna = `DataLimite${etapa}`;

          const { data, error } = await supabase
            .from('Posicao')
            .select(`
              Os, 
              Posicao, 
              ${operacaoColuna}, 
              ${horasColuna}, 
              ${dataLimiteColuna}, 
              ${etapaColuna},
              OrdemServico!inner(NumeroOsCliente, DataEntrega)
            `)
            .or(`${etapaColuna}.neq.Concluída,${etapaColuna}.is.null,${etapaColuna}.eq.`);

          if (!error && data) {
            data.forEach(item => {
              const operacao = item[operacaoColuna];
              if (maquinas.includes(operacao)) {
                osPorMaquina[operacao].push({
                  Os: item.Os,
                  Posicao: item.Posicao,
                  Etapa: etapa,
                  Horas: item[horasColuna],
                  DataLimite: item[dataLimiteColuna],
                  Status: item[etapaColuna],
                  NumeroOsCliente: item.OrdemServico?.NumeroOsCliente || 'N/A',
                  DataEntrega: item.OrdemServico?.DataEntrega
                });
              }
            });
          }
        }

        maquinas.forEach(maquina => {
          osPorMaquina[maquina].sort((a, b) => {
            const dataA = a.DataLimite ? new Date(a.DataLimite) : null;
            const dataB = b.DataLimite ? new Date(b.DataLimite) : null;
            const hoje = new Date();

            if (!dataA && !dataB) return 0;
            if (!dataA) return -1;
            if (!dataB) return 1;

            const aAtrasada = dataA < hoje;
            const bAtrasada = dataB < hoje;

            if (aAtrasada && !bAtrasada) return -1;
            if (!aAtrasada && bAtrasada) return 1;

            // Se as datas limite forem iguais
            if (dataA.getTime() === dataB.getTime()) {
              // Ordenar por data de entrega
              const entregaA = a.DataEntrega ? new Date(a.DataEntrega) : null;
              const entregaB = b.DataEntrega ? new Date(b.DataEntrega) : null;

              if (!entregaA && !entregaB) return String(a.Os).localeCompare(String(b.Os));
              if (!entregaA) return 1;
              if (!entregaB) return -1;

              if (entregaA.getTime() === entregaB.getTime()) {
                // Se as datas de entrega também forem iguais, ordenar por OS
                return String(a.Os).localeCompare(String(b.Os));
              }
              
              return entregaA - entregaB;
            }

            return dataA - dataB;
          });
        });

        setMaquinaOs(osPorMaquina);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Função de impressão usando nova janela (mais confiável)
  function handlePrint() {
    if (loading) {
      alert('Aguarde o carregamento dos dados antes de imprimir.');
      return;
    }

    if (Object.keys(maquinaOs).length === 0) {
      alert('Nenhum dado disponível para impressão.');
      return;
    }

    // Gerar HTML para impressão
    const printContent = generatePrintHTML();
    
    // Criar nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }

  // Gerar HTML puro para impressão
  function generatePrintHTML() {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Sequência de Produção</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: black;
                background: white;
            }
            
            .page-break {
                page-break-before: always;
                break-before: page;
                margin-top: 20px;
            }
            
            .page-break:first-child {
                page-break-before: avoid;
                break-before: avoid;
                margin-top: 0;
            }
            
            h2 {
                color: black;
                margin: 20px 0 10px 0;
                font-size: 18px;
                font-weight: bold;
            }
            
            h3 {
                color: black;
                margin: 15px 0 10px 0;
                font-size: 16px;
                font-weight: bold;
            }
            
            .os-item {
                border: 1px solid #000;
                margin-bottom: 8px;
                padding: 10px;
                background: white;
                color: black;
                font-size: 12px;
                line-height: 1.4;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .os-aguardando { border-left: 4px solid #ff0000; }
            .os-aguardando-material { border-left: 4px solid #ff8c00; }
            .os-andamento { border-left: 4px solid #007bff; }
            .os-concluida { border-left: 4px solid #28a745; }
            .os-default { border-left: 4px solid #6c757d; }
            
            .empty {
                font-style: italic;
                color: #666;
                padding: 10px 0;
            }
            
            strong {
                font-weight: bold;
                color: black;
            }
            
            @media print {
                body { margin: 15px; }
                .page-break { page-break-before: always; }
                .page-break:first-child { page-break-before: avoid; }
                * { -webkit-print-color-adjust: exact !important; }
            }
        </style>
    </head>
    <body>
    `;

    // Gerar conteúdo para cada máquina
    maquinas.forEach((maquina, index) => {
      const osList = maquinaOs[maquina] || [];
      const pageBreakClass = index === 0 ? 'page-break' : 'page-break';
      
      html += `
        <div class="${pageBreakClass}">
            <h2>📋 Ordens de Serviço - ${maquina}</h2>
            <h3>${maquina}</h3>
      `;

      if (osList.length > 0) {
        osList.forEach(os => {
          const statusInfo = statusMap[os.Status] || statusMap['default'];
          let statusClass = 'os-default';
          
          switch(os.Status) {
            case 'Aguardando': statusClass = 'os-aguardando'; break;
            case 'Aguardando Material': statusClass = 'os-aguardando-material'; break;
            case 'Em Andamento': statusClass = 'os-andamento'; break;
            case 'Concluída': statusClass = 'os-concluida'; break;
          }
          
          html += `
            <div class="os-item ${statusClass}">
                <strong>OS Cliente:</strong> ${os.NumeroOsCliente} | 
                <strong>OS:</strong> ${os.Os} | 
                <strong>Posição:</strong> ${os.Posicao} | 
                <strong>Etapa:</strong> ${os.Etapa} | 
          `;
          
          if (mostrarHoras) {
            html += `<strong>Horas:</strong> ${os.Horas || 'N/A'} | `;
          }
          
          const dataFormatada = os.DataLimite ? new Date(os.DataLimite).toLocaleDateString() : 'N/A';
          html += `<strong>Data Limite:</strong> ${dataFormatada}`;
          html += `</div>`;
        });
      } else {
        html += '<div class="empty">Nenhuma OS em andamento.</div>';
      }
      
      html += '</div>';
    });

    html += '</body></html>';
    return html;
  }

  function renderMaquina(maquina) {
    const osList = maquinaOs[maquina] || [];
    
    return (
      <div key={maquina} className={styles.pageBreak}>
        <h2>📋 Ordens de Serviço - {maquina}</h2>
        <div className={styles.maquinaLista}>
          <h3>{maquina}</h3>
          {osList.length > 0 ? (
            <ul className={styles.listaOs}>
              {osList.map((os) => {
                const statusInfo = statusMap[os.Status] || statusMap['default'];
                return (
                  <li
                    key={`${os.Os}-${os.Posicao}-${os.Etapa}`}
                    className={`${styles.itemOS} ${statusInfo.class}`}
                  >
                    <span className={styles.statusIcon}>
                      {statusInfo.icon}
                    </span>
                    <span className={styles.osTexto}>
                      <strong>OS Cliente:</strong> {os.NumeroOsCliente} |{' '}
                      <strong>OS:</strong> {os.Os} |{' '}
                      <strong>Posição:</strong> {os.Posicao} |{' '}
                      <strong>Etapa:</strong> {os.Etapa} |{' '}
                      {mostrarHoras && (
                        <span className={styles.horas}>
                          <strong>Horas:</strong> {os.Horas} |{' '}
                        </span>
                      )}
                      <strong>Data Limite:</strong>{' '}
                      {os.DataLimite ? new Date(os.DataLimite).toLocaleDateString() : 'N/A'}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>Nenhuma OS em andamento.</p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div>Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button className={styles.printButton} onClick={handlePrint}>
          🖨️ Imprimir
        </button>
        
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={mostrarHoras}
            onChange={(e) => setMostrarHoras(e.target.checked)}
            className={styles.checkbox}
          />
          Mostrar horas na impressão
        </label>
      </div>

      <div className={styles.tabelaContainer}>
        {maquinas.map(maquina => renderMaquina(maquina))}
      </div>
    </div>
  );
}

export default SeqProducao;