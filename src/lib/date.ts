export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Monday of the week containing `date`, at local midnight. */
export function getMonday(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7; // Mon=0 .. Sun=6
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTHS_TITLE = MONTHS_LONG.map((m) => m[0].toUpperCase() + m.slice(1));
const WEEKDAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function formatMonthLabel(date: Date): string {
  return `${MONTHS_TITLE[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_LONG[date.getDay()]} ${d} de ${MONTHS_LONG[m - 1]} ${y}`;
}
