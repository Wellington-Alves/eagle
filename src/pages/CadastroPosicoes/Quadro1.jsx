import React, { useState } from "react";
import CampoTexto from "./CampoTexto";
import styles from "./Quadro1.module.css";

const Quadro1 = ({
  os, setOs,
  dataEntrega,
  cliente,
  posicao, setPosicao,
  quantidadePecas, setQuantidadePecas,
  osError,
  quantidadeError,
  loading,
  handleBlur,
}) => {
  const [erroGeral, setErroGeral] = useState('');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Preparação de Processos</h1>

      <div className={styles.card}>
        {/* Seção Informações da Ordem de Serviço */}
        <div className={styles.secaoGrupo}>
          <h2 className={styles.secaoTitulo}>Informações da Ordem de Serviço</h2>
          <div className={styles.formRowHorizontal}>
            <CampoTexto
              label="Número da O.S *"
              value={os}
              onChange={(e) => setOs(e.target.value)}
              onBlur={() => handleBlur('os')}
              placeholder="Digite o número da O.S"
              id="os-input"
              className={osError ? styles.campoErro : ''}
            />
            {osError && <p className={styles.textoErro}>{osError}</p>}

            <CampoTexto
              label="Data de Entrega"
              value={dataEntrega}
              placeholder="DD/MM/AAAA"
              id="data-entrega-input"
              readOnly
            />

            <CampoTexto
              label="Cliente"
              value={cliente}
              placeholder="Nome do cliente"
              id="cliente-input"
              readOnly
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}></div>

        {/* Seção Detalhes da Posição */}
        <div className={styles.secaoGrupo}>
          <h2 className={styles.secaoTitulo}>Detalhes da Posição</h2>
          <div className={styles.formRowHorizontal}>
            <CampoTexto
              label="Posição *"
              value={posicao}
              onChange={(e) => setPosicao(e.target.value)}
              onBlur={() => handleBlur('posicao')}
              placeholder="Digite a posição"
              id="posicao-input"
            />

            <CampoTexto
              label="Quantidade de Peças"
              value={quantidadePecas}
              onChange={(e) => setQuantidadePecas(e.target.value)}
              placeholder="Digite a quantidade"
              type="number"
              id="quantidade-input"
              className={quantidadeError ? styles.campoErro : ''}
            />
            {quantidadeError && <p className={styles.textoErro}>{quantidadeError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quadro1;