export const formatDate = (date) => {
  if (!date) return '';
  
  // Se é uma string no formato yyyy-mm-dd
  if (typeof date === 'string' && date.includes('-')) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return date;
};