import React, { useMemo, useState, useEffect } from "react";
import { Days, CalendarStyled, Week, Navigation } from "./StyledComponents";
import { supabase } from '../../supabaseClient';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [datasUteis, setDatasUteis] = useState([]);
  const [alteracoes, setAlteracoes] = useState({});
  const [loading, setLoading] = useState(true);

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchDatasUteis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("DatasUteis")
          .select("DataID, Data, DiaUtil");

        if (error) throw error;

        const formattedData = data.map((item) => ({
          id: item.DataID,
          date: new Date(item.Data).toISOString().split('T')[0], // Formatar data
          isDiaUtil: item.DiaUtil
        }));

        setDatasUteis(formattedData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasUteis();
  }, []);

  // Gerar calendário
  const generateCalendar = (month) => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const calendarDays = [];
    const startDay = new Date(startOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    while (startDay <= endOfMonth) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(startDay));
        startDay.setDate(startDay.getDate() + 1);
      }
      calendarDays.push(week);
    }

    return calendarDays;
  };

  const calendarDays = useMemo(() => generateCalendar(currentMonth), [currentMonth]);

  // Determinar estado do dia
  const getDayState = (day) => {
    const dayFormatted = day.toISOString().split('T')[0]; // Formatar data no formato yyyy-mm-dd

    if (day.getMonth() !== currentMonth.getMonth()) {
      return "nonPertenceMonth"; // Dia não pertence ao mês atual
    }

    if (alteracoes[dayFormatted] !== undefined) {
      return alteracoes[dayFormatted] ? "green" : "red"; // Verifica se foi alterado manualmente
    }

    const diaNoBanco = datasUteis.find(d => d.date === dayFormatted);
    if (diaNoBanco) {
      return diaNoBanco.isDiaUtil ? "green" : "red"; // Usa a cor com base no DiaUtil
    }

    return "red"; // Default red caso não encontre no banco
  };

  // Alternar estado do dia
  const toggleDay = (day) => {
    if (day.getMonth() !== currentMonth.getMonth()) return;

    const dayFormatted = day.toISOString().split('T')[0];
    setAlteracoes(prev => ({
      ...prev,
      [dayFormatted]: !prev[dayFormatted] // Alterna entre verde/vermelho
    }));
  };

  // Salvar alterações no Supabase
  const salvarAlteracoes = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(alteracoes)
        .map(([date, isDiaUtil]) => {
          const existingData = datasUteis.find(d => d.date === date);
          return existingData
            ? { DataID: existingData.id, DiaUtil: isDiaUtil } // Usando DataID
            : null;
        })
        .filter(Boolean);

      for (const update of updates) {
        const { error } = await supabase
          .from("DatasUteis")
          .update({ DiaUtil: update.DiaUtil }) // Atualiza o valor de DiaUtil
          .eq("DataID", update.DataID); // Usa DataID para identificar o registro

        if (error) throw error;
      }

      // Recarregar dados após a atualização
      const { data } = await supabase.from("DatasUteis").select("DataID, Data, DiaUtil");
      setDatasUteis(
        data.map((item) => ({
          id: item.DataID,
          date: new Date(item.Data).toISOString().split('T')[0],
          isDiaUtil: item.DiaUtil,
        }))
      );
      setAlteracoes({}); // Limpar alterações
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalendarStyled>
      {/* Título do calendário */}
      <h1 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "150px" }}>Dias Úteis</h1>

      <Navigation>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
          ◀️
        </button>
        <div className="current-month-year">
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
          ▶️
        </button>
      </Navigation>

{/* Exibir os dias da semana */}
<Week style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px' }}>
  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, index) => (
    <div
      key={index}
      style={{
        textAlign: 'center',
        fontWeight: 'bold',
        flex: 1,
        fontSize: '1.5rem', // Aumentando o tamanho da fonte
        padding: '37px', // Aumentando o padding
      }}
    >
      {dia}
    </div>
  ))}
</Week>


      {/* Exibir o calendário */}
      {calendarDays.map((week, weekIndex) => (
        <Week key={weekIndex}>
          {week.map((day, dayIndex) => (
            <Days
              key={`${weekIndex}-${dayIndex}`}
              $state={getDayState(day)} // Definindo o estado da cor do dia
              onClick={() => toggleDay(day)} // Alternando o estado do dia
            >
              {day.getDate()}
            </Days>
          ))}
        </Week>
      ))}

      <button
        onClick={salvarAlteracoes}
        disabled={Object.keys(alteracoes).length === 0 || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: Object.keys(alteracoes).length === 0 || loading ? '#ccc' : '#20deae',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginTop: '20px',
          cursor: Object.keys(alteracoes).length === 0 || loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? "Salvando..." : "Salvar Alterações"}
      </button>
    </CalendarStyled>
  );
};

export default Calendar;
