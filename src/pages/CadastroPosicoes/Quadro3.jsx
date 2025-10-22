
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import CampoTexto from './CampoTexto';
import CampoSelect from './CampoSelect';
import styles from './Quadro3.module.css';

const Quadro3 = ({ linhas, handleLinhaChange, handleBlurQuadro3, isLoadingProcesso }) => {
  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {
    const fetchMaquinas = async () => {
      const { data, error } = await supabase
        .from('Maquinas')
        .select('NomeMaquina');

      if (error) {
        console.error('Erro ao buscar máquinas:', error);
      } else {
        setMaquinas(data.map((item) => item.NomeMaquina));
      }
    };

    fetchMaquinas();
  }, []);

  if (isLoadingProcesso) {
    return (
      <div className={styles.quadro}>
        <h1 className={styles.tituloQuadro}>Controle de Horas</h1>
        <div className={styles.espacoTitulo}></div>
        <div>Carregando operações...</div>
      </div>
    );
  }

  return (
    <div className={styles.quadro}>
      <h1 className={styles.tituloQuadro}>Controle de Horas</h1>
      <div className={styles.espacoTitulo}></div>
      <div className={styles.headerRow}>
        <div className={styles.headerCell}>#</div>
        <div className={styles.headerCell}>Máquina</div>
        <div className={styles.headerCell}>Horas</div>
        <div className={styles.headerCell}>Observação</div>
        <div className={styles.headerCell}>Status da Posição</div>
      </div>
      {Array.from({ length: 12 }, (_, index) => {
        const etapa = linhas[index]?.etapa || '';
        const statusOptions = [
          'Aguardando Material',
          'Em Andamento',
          'Concluída',
          'Cancelada',
          ...(etapa ? [etapa] : []),
        ];

        return (
          <div key={index} className={styles.dataRow}>
            <div className={styles.dataCell}>{index + 1}</div>
            <div className={styles.dataCell}>
              <CampoSelect
                options={maquinas}
                value={linhas[index]?.maquina || ''}
                onChange={(e) => handleLinhaChange(index, 'maquina', e.target.value)}
                onBlur={() => handleBlurQuadro3(index, 'maquina')}
                className={`${styles.campoSelect} ${styles.maquinaSelect}`}
              />
            </div>
            <div className={styles.dataCell}>
              <CampoTexto
                value={linhas[index]?.horas || ''}
                onChange={(e) => handleLinhaChange(index, 'horas', e.target.value)}
                onBlur={() => handleBlurQuadro3(index, 'horas')}
                placeholder="Digite as horas"
                className={styles.campoInput}
              />
            </div>
            <div className={styles.dataCell}>
              <CampoTexto
                value={linhas[index]?.observacao || ''}
                onChange={(e) => handleLinhaChange(index, 'observacao', e.target.value)}
                onBlur={() => handleBlurQuadro3(index, 'observacao')}
                placeholder="Observação"
                className={styles.campoInput}
              />
            </div>
            <div className={styles.dataCell}>
              <CampoSelect
                options={statusOptions}
                value={linhas[index]?.statusPosicao || ''}
                onChange={(e) => handleLinhaChange(index, 'statusPosicao', e.target.value)}
                className={`${styles.campoSelect} ${styles.statusSelect}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Quadro3;