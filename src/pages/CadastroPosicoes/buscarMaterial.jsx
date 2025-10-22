const buscarMaterial = async (os, posicao) => {
    if (!os || !posicao) return;
  
    const { data, error } = await supabase
      .from('Material')
      .select('QuantidadeMaterial, Tipo, Formato, Material, Beneficiado, Bitola, Largura, Comprimento')
      .eq('Os', os)
      .eq('Posicao', posicao);
  
    if (error) {
      console.error("Erro ao buscar material: ", error);
      return;
    }
  
    if (data.length > 0) {
      const materialData = data[0];
      setQuantidadeMaterial(materialData.QuantidadeMaterial);
      setTipo(materialData.Tipo);
      setFormato(materialData.Formato);
      setMaterial(materialData.Material);
      setBeneficiado(materialData.Beneficiado);
      setBitola(materialData.Bitola);
      setLargura(materialData.Largura);
      setComprimento(materialData.Comprimento);
    }
  };
  