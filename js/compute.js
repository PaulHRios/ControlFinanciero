// ============================================================================
//  CÁLCULOS FINANCIEROS
// ============================================================================
import { store } from "./store.js";
import { PHASES } from "../data/historical.js";
import { CONFIG } from "./config.js";

const CASA_FUNDS = [
  "casa_fase0",
  "casa_fase1",
  "casa_fase2",
  "casa_fase3",
  "casa_acabados",
];

/** Suma neta de un fondo (descuentos restan). */
export function netByFund(fund) {
  return store
    .getAllMovements()
    .filter((m) => m.fund === fund)
    .reduce((s, m) => s + (m.isDiscount ? -m.amountMXN : m.amountMXN), 0);
}

/** Total enviado a un fondo (solo entradas, sin descontar). */
export function sentByFund(fund) {
  return store
    .getAllMovements()
    .filter((m) => m.fund === fund && !m.isDiscount)
    .reduce((s, m) => s + m.amountMXN, 0);
}

/** Resumen por fase de la casa. */
export function phaseSummary() {
  return PHASES.map((p) => {
    const presupuesto = store.getPhaseBudget(p.id);
    const enviado = sentByFund(p.id);
    const neto = netByFund(p.id);
    const pct = presupuesto ? Math.min(100, (neto / presupuesto) * 100) : null;
    return { ...p, presupuesto, enviado, neto, pct };
  });
}

/** Total invertido en la casa (neto aplicado a obra, todas las fases). */
export function casaInvertido() {
  return CASA_FUNDS.reduce((s, f) => s + netByFund(f), 0);
}

/** Meta total de la casa (suma de presupuestos conocidos). */
export function casaMeta() {
  return CASA_FUNDS.reduce((s, f) => s + (store.getPhaseBudget(f) || 0), 0);
}

export function gbmBalance() {
  return netByFund("gbm");
}

export function gymBalance() {
  return netByFund("gym");
}

/** Datos específicos de Fase 2 (enviado vs neto aplicado). */
export function fase2Detail() {
  const enviado = sentByFund("casa_fase2");
  const neto = netByFund("casa_fase2");
  return { enviado, neto, diferencia: enviado - neto };
}

/**
 * Promedio mensual de aportaciones de Paúl.
 * Considera todas las entradas (no descuentos) de los últimos `months` meses.
 * Si hay envíos USD→MXN registrados, los prioriza como señal de aporte real.
 */
export function avgMonthlyContribution(months = 6) {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  const envios = store.getEnvios().filter((e) => new Date(e.date) >= cutoff);
  let total, source;
  if (envios.length > 0) {
    total = envios.reduce((s, e) => s + (e.mxn || 0), 0);
    source = "envios";
  } else {
    total = store
      .getAllMovements()
      .filter((m) => !m.isDiscount && new Date(m.date) >= cutoff)
      .reduce((s, m) => s + m.amountMXN, 0);
    source = "movimientos";
  }

  // Número de meses con actividad (mínimo 1) para no inflar el promedio.
  const span = Math.max(1, monthsBetween(cutoff, now));
  return { avg: total / span, total, months: span, source };
}

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/**
 * Estimador de tiempo por prioridad estricta:
 *   1) terminar Fase 3 de la casa
 *   2) gimnasio/bodega
 *   3) meta GBM
 * El reloj para cada meta corre en serie (una después de la otra).
 */
export function estimateTimeline() {
  const { avg, source, months } = avgMonthlyContribution(6);

  // Faltante Fase 3 (si no hay presupuesto, se marca como indefinido)
  const f3Budget = store.getPhaseBudget("casa_fase3");
  const f3Net = netByFund("casa_fase3");
  const f3Remaining = f3Budget != null ? Math.max(0, f3Budget - f3Net) : null;

  const gymRemaining = Math.max(0, CONFIG.metas.gym - gymBalance());
  const gbmRemaining = Math.max(0, CONFIG.metas.gbm - gbmBalance());

  const insufficient = avg <= 0;

  const monthsFor = (amount) =>
    amount == null ? null : insufficient ? Infinity : amount / avg;

  const f3Months = monthsFor(f3Remaining);
  const gymMonths = monthsFor(gymRemaining);
  const gbmMonths = monthsFor(gbmRemaining);

  // Acumulado en serie
  const f3Cum = f3Months;
  const gymCum = f3Cum == null ? gymMonths : add(f3Cum, gymMonths);
  const gbmCum = gymCum == null ? gbmMonths : add(gymCum, gbmMonths);

  return {
    avgMonthly: avg,
    source,
    monthsSampled: months,
    insufficient,
    metas: [
      buildMeta("Fase 3 — Casa", f3Remaining, f3Months, f3Cum),
      buildMeta("Gimnasio / Bodega", gymRemaining, gymMonths, gymCum),
      buildMeta("Meta GBM", gbmRemaining, gbmMonths, gbmCum),
    ],
  };
}

function add(a, b) {
  if (a == null || b == null) return null;
  return a + b;
}

function buildMeta(nombre, restante, mesesSolo, mesesAcum) {
  let fecha = null;
  if (mesesAcum != null && isFinite(mesesAcum)) {
    const d = new Date();
    d.setMonth(d.getMonth() + Math.ceil(mesesAcum));
    fecha = d;
  }
  return {
    nombre,
    restante,
    mesesSolo,
    mesesAcumulado: mesesAcum,
    fecha,
    indefinido: restante == null,
  };
}

/** Proyección GBM con interés compuesto al rendimiento anual configurado. */
export function gbmProjection() {
  const balance = gbmBalance();
  const meta = CONFIG.metas.gbm;
  const annual = CONFIG.metas.gbmRendimiento;
  const monthlyRate = annual / 12;
  const { avg } = avgMonthlyContribution(6);

  const points = [];
  let bal = balance;
  let months = 0;
  const maxMonths = 12 * 40;

  points.push({ month: 0, value: bal });
  while (bal < meta && months < maxMonths) {
    bal = bal * (1 + monthlyRate) + avg;
    months++;
    if (months % 3 === 0 || bal >= meta) points.push({ month: months, value: Math.min(bal, meta * 1.05) });
  }

  const reached = bal >= meta;
  let fecha = null;
  if (reached) {
    fecha = new Date();
    fecha.setMonth(fecha.getMonth() + months);
  }

  return {
    balance,
    meta,
    points,
    months: reached ? months : null,
    fecha,
    ingresoPasivoAnual: meta * CONFIG.metas.gbmRetiro,
    ingresoPasivoMensual: (meta * CONFIG.metas.gbmRetiro) / 12,
  };
}
