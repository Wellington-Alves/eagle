import styles from '../../styles';
import { Printer } from 'lucide-react';


const Impressao = ({ ordens }) => {
    const handlePrint = () => {
      console.log('Imprimindo as ordens...');
      // Lógica para imprimir
    };
  
    return (
      <button onClick={handlePrint} style={{ ...styles.button, ...styles.secondaryButton }}>
        <Printer style={styles.icon} />
      </button>
    );
  };
  
  export default Impressao;

