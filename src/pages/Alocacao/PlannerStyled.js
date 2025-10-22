import styled from "styled-components";

export const GridContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
  margin: 40px auto;
`;

export const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  background-color: #f0f0f0;
  font-weight: bold;
`;

export const HeaderCell = styled.div`
  padding: 15px;
  text-align: center;
  border-bottom: 2px solid #ccc;
  font-size: 1.2rem;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  border-bottom: 1px solid #ddd;
`;

export const MachineCell = styled.div`
  padding: 12px;
  background-color: #e9f5ff;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid #ccc;
`;

export const DayCell = styled.div`
  padding: 20px;
  border-right: 1px solid #eee;
  text-align: center;
  min-height: 60px;
`;
