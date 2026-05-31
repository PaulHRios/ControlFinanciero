// ============================================================================
//  Formateo de dinero, fechas y duraciones
// ============================================================================
const _mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const _usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const mxn = (n) => _mxn.format(Number(n) || 0);
export const usd = (n) => _usd.format(Number(n) || 0);
export const pct = (n, d = 0) => `${(Number(n) || 0).toFixed(d)}%`;

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-05-27" → "27 may 2026" */
export function fecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MES[m - 1]} ${y}`;
}

/** Date → "mayo 2028" */
export function mesAno(date) {
  return date ? `${MES_LARGO[date.getMonth()]} ${date.getFullYear()}` : "—";
}

/** meses → "2 años y 3 meses" */
export function duracion(meses) {
  if (!isFinite(meses) || meses < 0) return "—";
  const t = Math.ceil(meses);
  if (t < 1) return "menos de un mes";
  const y = Math.floor(t / 12), m = t % 12;
  const p = [];
  if (y) p.push(`${y} año${y > 1 ? "s" : ""}`);
  if (m) p.push(`${m} mes${m > 1 ? "es" : ""}`);
  return p.join(" y ") || `${t} meses`;
}

export const hoy = () => new Date().toISOString().slice(0, 10);
