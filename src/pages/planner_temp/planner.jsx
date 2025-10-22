// src/pages/Planner.jsx (exemplo do caminho)
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

function Planner() {   // 👈 Mantém o nome como Planner (importante se já existe rota)
  const [numeroOS, setNumeroOS] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const TOTAL_CAMPOS = 12;

  const handleLimpar = async () => {
    if (!numeroOS.trim()) {
      setMensagem("Digite um número de OS válido.");
      return;
    }

    const confirmado = window.confirm(
      `Tem certeza que deseja limpar os dados da OS ${numeroOS}? 
Isso irá apagar:
- DataLimite1 até DataLimite12
- DataPlan1 até DataPlan12
- Todos os registros na tabela Carga desta OS.`
    );

    if (!confirmado) {
      setMensagem("Operação cancelada.");
      return;
    }

    setLoading(true);
    setMensagem("");

    try {
      const camposNulos = {};
      for (let i = 1; i <= TOTAL_CAMPOS; i++) {
        camposNulos[`DataLimite${i}`] = null;
        camposNulos[`DataPlan${i}`] = null;
      }

      const { error: updateError } = await supabase
        .from("Posicao")
        .update(camposNulos)
        .eq("Os", numeroOS);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("Carga")
        .delete()
        .eq("Os", numeroOS);

      if (deleteError) throw deleteError;

      setMensagem(`✅ OS ${numeroOS} limpa com sucesso!`);
    } catch (error) {
      setMensagem(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <h1>Limpar OS</h1>
      <div className="form-container">
        <label>Número da OS</label>
        <input
          type="text"
          value={numeroOS}
          onChange={(e) => setNumeroOS(e.target.value)}
          placeholder="Digite a OS"
        />
        <button onClick={handleLimpar} disabled={loading}>
          {loading ? "Processando..." : "Limpar OS"}
        </button>
      </div>
      {mensagem && <p className="mensagem">{mensagem}</p>}
    </div>
  );
}

export default Planner;   // 👈 Exporta ainda como Planner
