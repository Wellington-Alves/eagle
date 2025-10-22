import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const useBuscarQuantidade = (os, posicao) => {
  const [quantidadePecas, setQuantidadePecas] = useState(null);
  const [quantidadeMaterial, setQuantidadeMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buscarDados = async () => {
      if (!os || !posicao) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Buscar dados da tabela Posicao
        const { data: posicaoData, error: posicaoError } = await supabase
          .from('Posicao')
          .select('QuantidadePecas, QuantidadeMaterial')
          .eq('Os', os)  // Certifique-se de que o nome da coluna está correto
          .eq('Posicao', posicao)
          .single();

        if (posicaoError) throw posicaoError;

        // Atualizar estados com os dados buscados
        setQuantidadePecas(posicaoData?.QuantidadePecas || 0);
        setQuantidadeMaterial(posicaoData?.QuantidadeMaterial || 0);

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [os, posicao]);

  return { quantidadePecas, quantidadeMaterial, loading, error };
};

export default useBuscarQuantidade;