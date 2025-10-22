import React from 'react';

// Função utilitária para dividir blocos de tarefa que atravessam o almoço
function dividirBlocoAlmoco(bloco, horasDia, horaAlmocoInicio, horaAlmocoFim) {
  const inicio = bloco.horaInicio;
  const fim = bloco.horaInicio + bloco.horas;
  const idxAlmocoInicio = horasDia.findIndex(h => parseInt(h) === horaAlmocoInicio);
  const idxAlmocoFim = horasDia.findIndex(h => parseInt(h) === horaAlmocoFim);

  // Se o bloco não atravessa o almoço, retorna como está
  if (fim <= idxAlmocoInicio || inicio >= idxAlmocoFim) {
    return [bloco];
  }

  // Se o bloco começa antes do almoço e termina depois, divide em dois
  const blocos = [];
  if (inicio < idxAlmocoInicio) {
    blocos.push({ ...bloco, horaInicio: inicio, horas: idxAlmocoInicio - inicio, posicaoX: (inicio / (horasDia.length - 1)) * 100, largura: ((idxAlmocoInicio - inicio) / (horasDia.length - 1)) * 100 });
  }
  // Bloco de almoço (não é tarefa, só para visual)
  blocos.push({
    isAlmoco: true,
    horaInicio: idxAlmocoInicio,
    horas: idxAlmocoFim - idxAlmocoInicio,
    posicaoX: (idxAlmocoInicio / (horasDia.length - 1)) * 100,
    largura: ((idxAlmocoFim - idxAlmocoInicio) / (horasDia.length - 1)) * 100
  });
  if (fim > idxAlmocoFim) {
    blocos.push({ ...bloco, horaInicio: idxAlmocoFim, horas: fim - idxAlmocoFim, posicaoX: (idxAlmocoFim / (horasDia.length - 1)) * 100, largura: ((fim - idxAlmocoFim) / (horasDia.length - 1)) * 100 });
  }
  return blocos;
}

const VisualizacaoSemanal = ({ diasSemana, linhas, horasDia, gerarCor, dadosSemana }) => {
  // Ajusta para mostrar até as 14h
  const horasVisiveis = horasDia.slice(0, horasDia.indexOf('15'));
  const horaAlmocoInicio = 12;
  const horaAlmocoFim = 13;
  const idxAlmocoInicio = horasVisiveis.findIndex(h => parseInt(h) === horaAlmocoInicio);
  const idxAlmocoFim = horasVisiveis.findIndex(h => parseInt(h) === horaAlmocoFim);

  return (
    <div className="container-semanal wide-semanal" style={{ overflowX: 'auto', minWidth: '1200px' }}>
      <div className="periodo-semanal">
        Semana de {diasSemana[0].dia}/{diasSemana[0].mes} a {diasSemana[6].dia}/{diasSemana[6].mes}
      </div>
      <div className="cabecalho-dias" style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ width: '120px' }}></div>
        {horasVisiveis.map((hora, i) => (
          <div
            key={i}
            style={{
              width: '100px',
              textAlign: 'center',
              background: parseInt(hora) === horaAlmocoInicio ? '#e0e0e0' : 'transparent',
              color: parseInt(hora) === horaAlmocoInicio ? '#333' : 'inherit',
              fontWeight: parseInt(hora) === horaAlmocoInicio ? 'bold' : 'normal',
              borderRadius: parseInt(hora) === horaAlmocoInicio ? '4px' : '0',
            }}
          >
            {hora}h
          </div>
        ))}
      </div>
      {diasSemana.map((dia, diaIndex) => (
        <div key={`linha-dia-${diaIndex}`} className="linha-semanal-dia" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', minHeight: '40px', borderBottom: '1px solid #eee' }}>
          <div className="dia-cabecalho" style={{ width: '120px', minWidth: '120px', textAlign: 'center', fontWeight: 'bold' }}>
            {dia.nome} <span style={{ fontWeight: 'normal' }}>{dia.dia}/{dia.mes}</span>
          </div>
          <div className="celula-dia" style={{ display: 'flex', flexDirection: 'row', flex: 1, position: 'relative', minHeight: '40px' }}>
            {/* Bloco cinza para o almoço */}
            <div style={{
              position: 'absolute',
              left: `calc(${(idxAlmocoInicio / (horasVisiveis.length - 1)) * 100}% )`,
              width: `calc(${((idxAlmocoFim - idxAlmocoInicio) / (horasVisiveis.length - 1)) * 100}% )`,
              height: '100%',
              background: '#e0e0e0',
              zIndex: 1,
              borderRadius: '4px',
              opacity: 0.7,
            }} />
            {linhas.map((linha, indexLinha) => (
              linha.map((tarefa) => (
                tarefa.blocos
                  .filter(bloco => bloco.dia === diaIndex)
                  .flatMap(bloco => dividirBlocoAlmoco(bloco, horasVisiveis, horaAlmocoInicio, horaAlmocoFim))
                  .map((bloco, blocoIndex) => (
                    bloco.isAlmoco ? (
                      null // Não renderiza bloco de tarefa para o almoço, só o fundo cinza
                    ) : (
                      <div
                        key={`${tarefa.Id}-${blocoIndex}-${diaIndex}-${indexLinha}`}
                        className="bloco-tarefa-semanal"
                        style={{
                          position: 'absolute',
                          left: `calc(${bloco.posicaoX}% + 0px)`,
                          width: `${bloco.largura}%`,
                          backgroundColor: tarefa.cor,
                          height: '30px',
                          top: `${indexLinha * 32}px`,
                          zIndex: 2,
                          borderRadius: '4px',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9em',
                        }}
                        title={`OS: ${tarefa.Os} - Pos: ${tarefa.Posicao} - ${tarefa.Horas_Programadas}h`}
                      >
                        <span>{bloco.largura > 15 ? `P.${tarefa.Posicao}` : '•'}</span>
                      </div>
                    )
                  ))
              ))
            ))}
            {/* Linhas de grade */}
            {horasVisiveis.map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `calc(${(i / (horasVisiveis.length - 1)) * 100}% )`,
                width: '1px',
                height: '100%',
                background: '#eee',
                zIndex: 1
              }} />
            ))}
          </div>
        </div>
      ))}
      <div className="legenda-tarefas">
        {dadosSemana.map((tarefa) => (
          <div 
            key={`${tarefa.Id}-${tarefa.dataFormatada}`}
            className="item-legenda"
            style={{ borderLeftColor: gerarCor(tarefa.Id) }}
          >
            <div className="cor-legenda" style={{ backgroundColor: gerarCor(tarefa.Id) }}></div>
            <div>
              <div className="os-legenda">OS: {tarefa.Os}</div>
              <div className="detalhes-legenda">
                Pos: {tarefa.Posicao} • {tarefa.Horas_Programadas}h • {tarefa.diaSemana}
              </div>
              <div className="data-legenda">
                {new Date(tarefa.dataFormatada + 'T00:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualizacaoSemanal;
