// ============================================================================
//  Tipo de cambio USD → MXN
// ============================================================================
import { CONFIG } from "./config.js";

const CACHE_KEY = "cc_fx_cache";
let current = { rate: CONFIG.fx.fallbackRate, date: null, source: "fallback" };

/** Devuelve el tipo de cambio actualmente en memoria (sincrónico). */
export function getRate() {
  return current.rate;
}

export function getRateInfo() {
  return { ...current };
}

/** Obtiene el tipo de cambio de la API (con caché de 6 h y respaldo). */
export async function loadRate() {
  // Caché en localStorage (válida 6 horas)
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.ts < 6 * 60 * 60 * 1000) {
      current = { rate: cached.rate, date: cached.date, source: "cache" };
    }
  } catch (_) {}

  try {
    const res = await fetch(CONFIG.fx.apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("fx http " + res.status);
    const data = await res.json();
    const rate = data?.rates?.MXN;
    if (rate) {
      current = { rate, date: data.date, source: "api" };
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ rate, date: data.date, ts: Date.now() })
      );
    }
  } catch (_) {
    // Se mantiene la caché o el respaldo.
    if (current.source === "fallback") {
      current = {
        rate: CONFIG.fx.fallbackRate,
        date: null,
        source: "fallback",
      };
    }
  }
  return current;
}

export const usdToMxn = (usd) => (Number(usd) || 0) * current.rate;
export const mxnToUsd = (mxn) => (Number(mxn) || 0) / current.rate;
