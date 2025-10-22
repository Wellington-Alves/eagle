import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const useBuscarOS = (os) => {
  const [cliente, setCliente] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Adicionando estado de carregamento

  const buscarOS = async () => {
    if (!os) return;

    setLoading(true); // Inicia o carregamento

    try {
      const { data, error } = await supabase
        .from('OrdemServico')
        .select('Cliente, DataEntrega')
        .eq('Os', os)
        .single();

      if (error) throw error;

      if (data) {
        setCliente(data.Cliente);
        setDataEntrega(new Date(data.DataEntrega).toLocaleDateString('pt-BR'));
        setError(''); // Limpa o erro
      } else {
        setError('O.S não encontrada.');
      }
    } catch (err) {
      setError('Erro ao buscar O.S.');
      console.error(err);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };

  return { cliente, dataEntrega, error, loading, buscarOS };
};

export default useBuscarOS;
