// ============================================================================
//  Tipo de cambio USD → MXN (frankfurter.app con caché y respaldo)
// ============================================================================
import { CONFIG } from "./config.js";

let rate = CONFIG.fx.fallbackRate;

export const getRate = () => rate;
export const aUSD = (m) => (Number(m) || 0) / rate;

export async function loadRate() {
  try {
    const cached = JSON.parse(localStorage.getItem("cc_fx") || "null");
    if (cached && Date.now() - cached.ts < 6 * 3600 * 1000) rate = cached.rate;
  } catch {}
  try {
    const res = await fetch(CONFIG.fx.apiUrl, { cache: "no-store" });
    const data = await res.json();
    if (data?.rates?.MXN) {
      rate = data.rates.MXN;
      localStorage.setItem("cc_fx", JSON.stringify({ rate, ts: Date.now() }));
    }
  } catch {
    /* se queda con caché o respaldo */
  }
  return rate;
}
