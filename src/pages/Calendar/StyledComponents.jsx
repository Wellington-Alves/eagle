import styled, { css } from "styled-components";

export const Days = styled.div`
  display: inline-block;
  width: 80px;
  height: 80px;
  padding: 10px;
  margin: 8px;
  transform: scale(0.9);
  transition: all ease 0.2s;
  cursor: pointer;
  border-radius: 40px;
  text-align: center;
  vertical-align: middle;
  font-size: 1.5em;

  &:hover {
    transform: scale(1);
    background-color: #f0f0f0;
  }

  ${(props) =>
    props.$state === "green" &&
    css`
      background-color: #20deae;
      color: #fff;
    `}

  ${(props) =>
    props.$state === "red" &&
    css`
      background-color: #ff6347;
      color: #fff;
    `}

  ${(props) =>
    props.$state === "nonPertenceMonth" &&
    css`
      opacity: 0.3;
      cursor: default;
      pointer-events: none; /* Impede interações */
      &:hover {
        transform: scale(0.9); /* Impede o efeito de escala */
        background-color: inherit; /* Mantém o fundo inalterado */
      }
    `}
`;

export const CalendarStyled = styled.div`
  position: absolute; /* Centraliza em relação à tela */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px; /* Dobrado de 400px para 800px */
  padding: 20px;
`;

export const Week = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px; /* Aumenta o espaçamento entre os dias */
`;

export const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 16px;

  button {
    background: none;
    border: none;
    font-size: 20px; /* Aumentar os botões de navegação */
    cursor: pointer;
    padding: 12px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f0f0f0;
    }
  }

  .current-month-year {
    font-size: 24px; /* Aumentar o tamanho do mês e ano */
    font-weight: bold;
  }
`;

