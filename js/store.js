// ============================================================================
//  STORE — capa de datos
// ----------------------------------------------------------------------------
//  Fuente de verdad local (localStorage) con sincronización opcional a Google
//  Sheets vía Apps Script. Los datos históricos son inmutables y viven en
//  data/historical.js; aquí solo se gestionan los registros nuevos.
// ============================================================================
import { CONFIG } from "./config.js";
import { HISTORICAL_MOVEMENTS, PHASES } from "../data/historical.js";

const LS_KEY = "cc_casa_data_v1";

const defaultState = () => ({
  movements: [], // movimientos nuevos del usuario
  envios: [], // envíos USD → MXN
  nu: { balance: 0, history: [] }, // saldo Nu (editable) + historial informativo
  phaseBudgets: {}, // overrides editables de presupuesto (fase0, fase3)
});

let state = defaultState();

const useSheets = () => Boolean(CONFIG.sheets.webAppUrl);

// --- Persistencia local ------------------------------------------------------
function persistLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state = { ...defaultState(), ...JSON.parse(raw) };
  } catch (_) {
    state = defaultState();
  }
}

// --- Sincronización con Google Sheets ---------------------------------------
async function sheetsRequest(action, payload = {}) {
  const token = sessionStorage.getItem("cc_auth_token") || "";
  const res = await fetch(CONFIG.sheets.webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS
    body: JSON.stringify({ action, token, ...payload }),
  });
  if (!res.ok) throw new Error("sheets http " + res.status);
  return res.json();
}

async function pullFromSheets() {
  try {
    const data = await sheetsRequest("getAll");
    if (data && data.ok) {
      state.movements = data.movements || [];
      state.envios = data.envios || [];
      state.nu = data.nu || { balance: 0, history: [] };
      state.phaseBudgets = data.phaseBudgets || {};
      persistLocal();
    }
  } catch (e) {
    console.warn("No se pudo sincronizar con Google Sheets:", e.message);
  }
}

// --- API pública -------------------------------------------------------------
export const store = {
  async init() {
    loadLocal();
    if (useSheets()) await pullFromSheets();
  },

  isCloudEnabled: () => useSheets(),

  // ---- Movimientos ----
  getUserMovements() {
    return [...state.movements];
  },

  getAllMovements() {
    return [...HISTORICAL_MOVEMENTS.map(markHistorical), ...state.movements].sort(
      byDateDesc
    );
  },

  async addMovement(mv) {
    const record = {
      id: "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      date: mv.date,
      fund: mv.fund,
      concept: mv.concept,
      amountMXN: Math.abs(Number(mv.amountMXN) || 0),
      isDiscount: Boolean(mv.isDiscount),
      notes: mv.notes || "",
      historical: false,
      createdAt: new Date().toISOString(),
    };
    state.movements.push(record);
    persistLocal();
    if (useSheets()) await sheetsRequest("addMovement", { record }).catch(() => {});
    return record;
  },

  // ---- Envíos USD → MXN ----
  getEnvios() {
    return [...state.envios].sort(byDateDesc);
  },

  async addEnvio(env) {
    const record = {
      id: "e-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      date: env.date,
      usd: Number(env.usd) || 0,
      rate: Number(env.rate) || 0,
      mxn: Number(env.mxn) || 0,
      platform: env.platform || "Otro",
      fund: env.fund || "general",
      notes: env.notes || "",
      createdAt: new Date().toISOString(),
    };
    state.envios.push(record);
    persistLocal();
    if (useSheets()) await sheetsRequest("addEnvio", { record }).catch(() => {});
    return record;
  },

  // ---- Nu ----
  getNu() {
    return { ...state.nu };
  },

  async setNu(balance, note = "") {
    const prev = state.nu.balance;
    state.nu.balance = Number(balance) || 0;
    state.nu.history.unshift({
      date: new Date().toISOString(),
      from: prev,
      to: state.nu.balance,
      note,
    });
    persistLocal();
    if (useSheets()) await sheetsRequest("setNu", { nu: state.nu }).catch(() => {});
  },

  // ---- Presupuestos editables (placeholders fase 0 y fase 3) ----
  getPhaseBudget(phaseId) {
    const phase = PHASES.find((p) => p.id === phaseId);
    if (state.phaseBudgets[phaseId] != null) return state.phaseBudgets[phaseId];
    return phase ? phase.presupuesto : null;
  },

  async setPhaseBudget(phaseId, value) {
    state.phaseBudgets[phaseId] = Number(value) || 0;
    persistLocal();
    if (useSheets())
      await sheetsRequest("setPhaseBudget", { phaseId, value }).catch(() => {});
  },

  exportRaw: () => JSON.stringify(state, null, 2),
};

function markHistorical(m) {
  return { ...m, historical: true };
}

function byDateDesc(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}
