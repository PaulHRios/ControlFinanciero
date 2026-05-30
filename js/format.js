// ============================================================================
//  Formateo de números y fechas
// ============================================================================

const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const MXN2 = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtMXN = (n, decimals = false) =>
  (decimals ? MXN2 : MXN).format(Number(n) || 0);

export const fmtUSD = (n, decimals = false) =>
  (decimals ? USD2 : USD).format(Number(n) || 0);

export const fmtNumber = (n) =>
  new Intl.NumberFormat("es-MX").format(Number(n) || 0);

export const fmtPct = (n, decimals = 1) =>
  `${(Number(n) || 0).toFixed(decimals)}%`;

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-05-27" -> "27 may 2026" */
export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MESES[m - 1]} ${y}`;
}

/** Date -> "mayo 2028" */
export function fmtMonthYear(date) {
  return `${MESES_LARGO[date.getMonth()]} ${date.getFullYear()}`;
}

/** Convierte un número de meses a "X años y X meses". */
export function fmtDuration(months) {
  if (!isFinite(months) || months < 0) return "—";
  const total = Math.ceil(months);
  if (total < 1) return "menos de un mes";
  const y = Math.floor(total / 12);
  const m = total % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} año${y > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} mes${m > 1 ? "es" : ""}`);
  return parts.join(" y ") || `${total} meses`;
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}
