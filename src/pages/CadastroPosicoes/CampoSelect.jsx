import React, { useState } from 'react';
import styles from './CampoSelect.module.css';

const CampoSelect = ({ label, value, onChange, options, id, placeholder, allowCustomInput, className }) => {
  const [customValue, setCustomValue] = useState(value);

  const handleInputChange = (e) => {
    setCustomValue(e.target.value);
    onChange(e);
  };

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    setCustomValue(selectedValue);
    onChange(e);
  };

  return (
    <div className={`${styles.campo} ${className || ''}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {allowCustomInput ? (
        <>
          <select
            id={id}
            value={customValue || ""}
            onChange={handleSelectChange}
            className={styles.select}
          >
            <option value="">{placeholder}</option>
            {options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={customValue || ""}
            onChange={handleInputChange}
            placeholder="Digite uma opção"
            className={styles.input}
          />
        </>
      ) : (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={styles.select}
        >
          <option value="">{placeholder}</option>
          {options?.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CampoSelect;
