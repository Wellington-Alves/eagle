import React from "react";
import styles from "./Quadro2.module.css"; // Importando o CSS Module

const Quadro2 = ({
  quantidadeMaterial,
  setQuantidadeMaterial,
  tipo,
  setTipo,
  formato,
  setFormato,
  material,
  setMaterial,
  beneficiado,
  setBeneficiado,
  bitola,
  setBitola,
  largura,
  setLargura,
  comprimento,
  setComprimento,
}) => {
  const opcoesTipo = ["Laminado", "Trefilado", "C.M", "C.A", "Reaproveitamento"];
  const opcoesFormato = ["Ø", "#", "Tubo Ø", "Tubo #", "Trefilado", "Sextavado"];
  const opcoesMaterial = [
    "SAE 1020",
    "SAE 1045",
    "SAE 2080",
    "SAE 8620",
    "SAE 8640",
    "Aço Prata",
    "Inox",
    "Alumínio",
    "Bronze",
    "Cobre",
    "VC 131",
    "D2",
  ];

  const opcoesBitola = [
    '1/4" (6,35 mm)', '3/8" (9,525 mm)', '1/2" (12,7 mm)', '5/8" (15,875 mm)',
    '3/4" (19,05 mm)', '7/8" (22,225 mm)', '1" (25,4 mm)', '1 1/4" (31,75 mm)',
    '1 1/2" (38,1 mm)', '1 3/4" (44,45 mm)', '2" (50,8 mm)', '2 1/4" (57,15 mm)',
    '2 1/2" (63,5 mm)', '2 3/4" (69,85 mm)', '3" (76,2 mm)', '3 1/4" (82,55 mm)',
    '3 1/2" (88,9 mm)', '3 3/4" (95,25 mm)', '4" (101,6 mm)', '4 1/2" (114,3 mm)',
    '5" (127 mm)', '5 1/2" (139,7 mm)', '6" (152,4 mm)', '7" (177,8 mm)',
    '8" (203,2 mm)', '9" (228,6 mm)', '10" (254 mm)',
  ];

  const handleNumericoChange = (setter) => (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <div className={styles.quadro2}>
      <h2 className={styles.titulo}>Detalhes dos Materiais</h2>
      <div className={styles.campos}>
        <div className={styles.linha}>
          {/* Campo Qtd. Material */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Qtd. Material</strong>
            </label>
            <input
              type="number"
              value={quantidadeMaterial}
              onChange={handleNumericoChange(setQuantidadeMaterial)}
              placeholder="Ex: 10"
              className={`${styles.campoInput} ${styles.campoPequeno}`}
              min="0"
            />
          </div>

          {/* Grupo Material (Tipo, Formato, Material) */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Material</strong>
            </label>
            <div className={styles.grupoMaterial}>
              {/* Campo Tipo */}
              <div>
                <input
                  type="text"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="(Ex: Laminado)"
                  className={`${styles.campoInput} ${styles.campoPequeno}`}
                  list="opcoesTipo"
                />
                <datalist id="opcoesTipo">
                  {opcoesTipo.map((opcao, index) => (
                    <option key={index} value={opcao} />
                  ))}
                </datalist>
              </div>

              {/* Campo Formato */}
              <div>
                <input
                  type="text"
                  value={formato}
                  onChange={(e) => setFormato(e.target.value)}
                  placeholder="(Ex: Ø)"
                  className={`${styles.campoInput} ${styles.campoPequeno}`}
                  list="opcoesFormato"
                />
                <datalist id="opcoesFormato">
                  {opcoesFormato.map((opcao, index) => (
                    <option key={index} value={opcao} />
                  ))}
                </datalist>
              </div>

              {/* Campo Material */}
              <div>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Material (Ex: SAE 1020)"
                  className={`${styles.campoInput} ${styles.campoFlexivel}`}
                  list="opcoesMaterial"
                />
                <datalist id="opcoesMaterial">
                  {opcoesMaterial.map((opcao, index) => (
                    <option key={index} value={opcao} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Campo Beneficiado */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Beneficiado</strong>
            </label>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={beneficiado}
                onChange={(e) => setBeneficiado(e.target.checked)}
                className={styles.campoCheckbox}
              />
              <span className={styles.checkboxLabel}>Sim</span>
            </div>
          </div>
        </div>

        <div className={styles.linha}>
          {/* Campo Bitola */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Bitola</strong>
            </label>
            <input
              type="text"
              value={bitola}
              onChange={(e) => setBitola(e.target.value)}
              placeholder='Ex: 1/2" (12,7 mm)'
              className={styles.campoInput}
              list="opcoesBitola"
            />
            <datalist id="opcoesBitola">
              {opcoesBitola.map((opcao, index) => (
                <option key={index} value={opcao} />
              ))}
            </datalist>
          </div>

          {/* Campo Largura */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Largura</strong>
            </label>
            <input
              type="number"
              value={largura}
              onChange={handleNumericoChange(setLargura)}
              placeholder="Ex: 100"
              className={styles.campoInput}
              min="0"
            />
          </div>

          {/* Campo Comprimento */}
          <div className={styles.campo}>
            <label className={styles.campoLabel}>
              <strong>Comprimento</strong>
            </label>
            <input
              type="number"
              value={comprimento}
              onChange={handleNumericoChange(setComprimento)}
              placeholder="Ex: 500"
              className={styles.campoInput}
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quadro2;
