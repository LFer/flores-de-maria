// Argentine peso formatting — thousands separated by ".", no decimals.
// Implemented manually because Hermes' Intl support is inconsistent across platforms.
export function formatARS(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${grouped}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "20 jun" style short date label used across the order/expense lists.
export function shortDate(d: Date = new Date()): string {
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
