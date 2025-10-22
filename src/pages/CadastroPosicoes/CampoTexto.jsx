import React from 'react';
import styles from './Quadro1.module.css'; // Importe os mesmos estilos

const CampoTexto = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  onBlur, 
  id, 
  className = '', 
  readOnly = false, 
  type = 'text'
}) => {
  return (
    <div className={styles.formGrupo}>
      {label && <label htmlFor={id} className={styles.campoLabel}>{label}</label>}
      <input
        type={type}
        id={id}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${styles.campoInput} ${className}`}
        readOnly={readOnly}
      />
    </div>
  );
};

export default CampoTexto;