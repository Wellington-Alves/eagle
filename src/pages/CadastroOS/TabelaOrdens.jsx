import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatDate } from "./formatDate";
import styles from '../../styles';

const TabelaOrdens = ({ ordens, searchTerm, sortConfig, handleSort }) => {
  // Ordenação das ordens
  const sortedOrdens = React.useMemo(() => {
    const sortedData = [...ordens];
    sortedData.sort((a, b) => {
      const aPrimary = a.Os;
      const bPrimary = b.Os;
      if (aPrimary < bPrimary) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aPrimary > bPrimary) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedData;
  }, [ordens, sortConfig]);

  // Filtragem das ordens
  const filteredOrdens = React.useMemo(() => {
    if (!searchTerm) return sortedOrdens;
    return sortedOrdens.filter((ordem) =>
      Object.values(ordem).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedOrdens, searchTerm]);

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th onClick={() => handleSort('Os')}>
            OS {sortConfig.key === 'Os' && (sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />)}
          </th>
          <th onClick={() => handleSort('NumeroOsCliente')}>
            Número OS Cliente {sortConfig.key === 'NumeroOsCliente' && (sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />)}
          </th>
          <th onClick={() => handleSort('Cliente')}>
            Cliente {sortConfig.key === 'Cliente' && (sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />)}
          </th>
          <th onClick={() => handleSort('DataEntrega')}>
            Data de Entrega {sortConfig.key === 'DataEntrega' && (sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />)}
          </th>
          <th>Status</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {filteredOrdens.map((ordem) => (
          <tr key={ordem.Os}> {/* Usando a chave primária (Os) como chave única */}
            <td>{ordem.Os}</td>
            <td>{ordem.NumeroOsCliente}</td>
            <td>{ordem.Cliente}</td>
            <td>{formatDate(ordem.DataEntrega)}</td>
            <td>{ordem.StatusOs}</td>
            <td>{ordem.Observacao}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TabelaOrdens;
