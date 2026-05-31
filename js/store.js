// ============================================================================
//  STORE — almacenamiento y cálculos
// ----------------------------------------------------------------------------
//  Fuente de verdad: localStorage (este dispositivo) + opcional Google Sheets.
//  Los movimientos del historial (SEED_MOVES) son inmutables; los nuevos que
//  registra el usuario sí se pueden borrar.
// ============================================================================
import { CONFIG } from "./config.js";
import { SEED_MOVES, PHASES, PHASE_IDS } from "./data.js";
import { hoy } from "./format.js";

const LS_KEY = "cc_casa_v2";

const blank = () => ({
  moves: [], // movimientos nuevos del usuario
  budgets: {}, // presupuestos editables (fase 0 y 3)
});

let state = blank();
const cloud = () => Boolean(CONFIG.sheets.webAppUrl);

// --- Persistencia ------------------------------------------------------------
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state = { ...blank(), ...JSON.parse(raw) };
  } catch {
    state = blank();
  }
}

async function api(action, payload = {}) {
  const token = sessionStorage.getItem("cc_token") || "";
  const res = await fetch(CONFIG.sheets.webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token, ...payload }),
  });
  if (!res.ok) throw new Error("http " + res.status);
  return res.json();
}

// --- Inicialización ----------------------------------------------------------
export async function initStore() {
  load();
  if (cloud()) {
    try {
      const data = await api("getAll");
      if (data?.ok) {
        state.moves = data.moves || [];
        state.budgets = data.budgets || {};
        save();
      }
    } catch (e) {
      console.warn("Sin conexión a Sheets, uso datos locales:", e.message);
    }
  }
}

export const isCloud = () => cloud();

/** Verifica que localStorage funcione de verdad (escribe y lee). */
export function storageWorks() {
  try {
    const k = "__cc_test__";
    localStorage.setItem(k, "1");
    const ok = localStorage.getItem(k) === "1";
    localStorage.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}

// --- Movimientos -------------------------------------------------------------
/** Todos los movimientos (semilla + nuevos), ordenados por fecha desc. */
export function allMoves() {
  return [...SEED_MOVES, ...state.moves].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
}

export async function addMove(mv) {
  const rec = {
    id: "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    date: mv.date,
    kind: mv.kind, // transfer | pago | regalo | aporte
    fase: mv.fase || null, // solo para pago
    fund: mv.fund || null, // solo para aporte (gbm/gym)
    concepto: mv.concepto || "",
    monto: Math.abs(Number(mv.monto) || 0),
    notas: mv.notas || "",
    historical: false,
    createdAt: new Date().toISOString(),
  };
  state.moves.push(rec);
  save();
  if (cloud()) api("addMove", { rec }).catch(() => {});
  return rec;
}

export async function deleteMove(id) {
  state.moves = state.moves.filter((m) => m.id !== id);
  save();
  if (cloud()) api("deleteMove", { id }).catch(() => {});
}

// --- Presupuestos editables --------------------------------------------------
export function budget(faseId) {
  if (state.budgets[faseId] != null) return state.budgets[faseId];
  return PHASES.find((p) => p.id === faseId)?.presupuesto ?? null;
}

export async function setBudget(faseId, value) {
  state.budgets[faseId] = Number(value) || 0;
  save();
  if (cloud()) api("setBudget", { faseId, value }).catch(() => {});
}

// --- Fondos de inversión (GBM / Gimnasio) ------------------------------------
//  El saldo se DERIVA de los movimientos de tipo "aporte", igual que el
//  disponible de mamá o lo pagado por fase: una sola fuente de verdad.
export function fundBalance(fund) {
  return allMoves()
    .filter((m) => m.kind === "aporte" && m.fund === fund)
    .reduce((s, m) => s + m.monto, 0);
}

export async function addToFund(fund, amount, notas = "") {
  await addMove({ kind: "aporte", fund, concepto: "Aportación", monto: amount, notas, date: hoy() });
}

// ============================================================================
//  CÁLCULOS — el corazón de la lógica corregida
// ============================================================================

/** Cuenta de mamá: recibido, pagado, regalado y DISPONIBLE. */
export function cuentaMama() {
  const moves = allMoves();
  let recibido = 0,
    pagado = 0,
    regalado = 0;
  for (const m of moves) {
    if (m.kind === "transfer") recibido += m.monto;
    else if (m.kind === "pago") pagado += m.monto;
    else if (m.kind === "regalo") regalado += m.monto;
  }
  return {
    recibido,
    pagado,
    regalado,
    disponible: recibido - pagado - regalado,
  };
}

/** Total pagado a una fase concreta. */
export function pagadoFase(faseId) {
  return allMoves()
    .filter((m) => m.kind === "pago" && m.fase === faseId)
    .reduce((s, m) => s + m.monto, 0);
}

/** Resumen por fase: presupuesto, pagado, falta y % de avance. */
export function resumenFases() {
  return PHASES.map((p) => {
    const presupuesto = budget(p.id);
    const pagado = pagadoFase(p.id);
    const falta = presupuesto != null ? Math.max(0, presupuesto - pagado) : null;
    const pct = presupuesto ? Math.min(100, (pagado / presupuesto) * 100) : null;
    return { ...p, presupuesto, pagado, falta, pct };
  });
}

/** Total pagado a la casa (todas las fases). */
export function casaPagado() {
  return PHASE_IDS.reduce((s, id) => s + pagadoFase(id), 0);
}

/** Meta total de la casa (suma de presupuestos conocidos). */
export function casaMeta() {
  return PHASE_IDS.reduce((s, id) => s + (budget(id) || 0), 0);
}

/** Promedio mensual de envíos de Paúl (últimos N meses). */
export function promedioMensual(meses = 6) {
  const corte = new Date();
  corte.setMonth(corte.getMonth() - meses);
  const transfers = allMoves().filter(
    (m) => m.kind === "transfer" && new Date(m.date) >= corte
  );
  const total = transfers.reduce((s, m) => s + m.monto, 0);
  return total / meses;
}

/**
 * Estimador de tiempo en serie: Fase 3 → Gimnasio → GBM.
 * Cada meta empieza cuando termina la anterior.
 */
export function estimador() {
  const avg = promedioMensual(6);
  const insuficiente = avg <= 0;

  const metas = [
    { nombre: "Terminar Fase 3", falta: faltaFase3() },
    { nombre: "Gimnasio / Bodega", falta: Math.max(0, CONFIG.metas.gym - fundBalance("gym")) },
    { nombre: "Meta GBM", falta: Math.max(0, CONFIG.metas.gbm - fundBalance("gbm")) },
  ];

  let acum = 0;
  return {
    avg,
    insuficiente,
    metas: metas.map((m) => {
      if (m.falta == null) return { ...m, indefinido: true };
      const meses = insuficiente ? Infinity : m.falta / avg;
      acum += isFinite(meses) ? meses : 0;
      const fecha = isFinite(meses) ? mesesDesdeHoy(acum) : null;
      return { ...m, meses, mesesAcum: acum, fecha };
    }),
  };
}

function faltaFase3() {
  const b = budget("casa_fase3");
  if (b == null) return null;
  return Math.max(0, b - pagadoFase("casa_fase3"));
}

function mesesDesdeHoy(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(meses));
  return d;
}

/** Proyección GBM con interés compuesto. */
export function proyeccionGBM() {
  const meta = CONFIG.metas.gbm;
  const tasaMensual = CONFIG.metas.gbmRendimiento / 12;
  const avg = promedioMensual(6);
  let saldo = fundBalance("gbm");
  const puntos = [{ mes: 0, valor: saldo }];
  let mes = 0;
  while (saldo < meta && mes < 480) {
    saldo = saldo * (1 + tasaMensual) + avg;
    mes++;
    if (mes % 3 === 0 || saldo >= meta) puntos.push({ mes, valor: Math.min(saldo, meta) });
  }
  const alcanzada = saldo >= meta;
  return {
    saldo: fundBalance("gbm"),
    meta,
    puntos,
    meses: alcanzada ? mes : null,
    fecha: alcanzada ? mesesDesdeHoy(mes) : null,
    ingresoAnual: meta * CONFIG.metas.gbmRetiro,
    ingresoMensual: (meta * CONFIG.metas.gbmRetiro) / 12,
  };
}
