import styles from '../../styles';

const Pesquisa = ({ searchTerm, setSearchTerm }) => (
    <div style={styles.searchContainer}>
      <input
        type="text"
        placeholder="Pesquisar ordens..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />
    </div>
  );
  
  export default Pesquisa;
  