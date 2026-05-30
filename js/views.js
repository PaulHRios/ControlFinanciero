// ============================================================================
//  VISTAS — render de cada pestaña
// ============================================================================
import { store } from "./store.js";
import {
  phaseSummary, casaInvertido, casaMeta, gbmBalance, gymBalance,
  fase2Detail, estimateTimeline, gbmProjection, avgMonthlyContribution,
} from "./compute.js";
import { CONFIG } from "./config.js";
import { fmtMXN, fmtUSD, fmtPct, fmtDate, fmtMonthYear, fmtDuration } from "./format.js";
import { getRate, getRateInfo, mxnToUsd } from "./fx.js";
import { progressBar, lineChart } from "./charts.js";
import { icon } from "./icons.js";
import { emptyState } from "./ui.js";
import { fundLabel } from "./funds.js";
import {
  openMovementForm, openEnvioForm, openNuForm, openPhaseBudgetForm,
} from "./forms.js";

const STATE_BADGE = {
  completada: `<span class="badge badge-success">Completada</span>`,
  en_progreso: `<span class="badge badge-accent">En progreso</span>`,
  pendiente: `<span class="badge badge-warn">Pendiente</span>`,
};

// Tarjeta de estadística grande
function statCard({ label, value, sub, tone }) {
  return `<div class="stat-card ${tone ? "tone-" + tone : ""}">
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    ${sub ? `<div class="stat-sub">${sub}</div>` : ""}
  </div>`;
}

function usdRef(mxn) {
  return `<span class="usd-ref">≈ ${fmtUSD(mxnToUsd(mxn))} USD</span>`;
}

// ---------------------------------------------------------------------------
//  DASHBOARD
// ---------------------------------------------------------------------------
function dashboard(app) {
  const invertido = casaInvertido();
  const meta = casaMeta();
  const casaPct = meta ? (invertido / meta) * 100 : 0;
  const gbm = gbmBalance();
  const gym = gymBalance();
  const nu = store.getNu().balance;
  const rateInfo = getRateInfo();
  const recent = store.getAllMovements().slice(0, 5);

  const fundsGrid = [
    fundProgress("Casa", invertido, meta, "home"),
    fundProgress("GBM", gbm, CONFIG.metas.gbm, "trending"),
    fundProgress("Gimnasio", gym, CONFIG.metas.gym, "dumbbell"),
    fundNu(nu),
  ].join("");

  return `
  <section class="view">
    <div class="view-head">
      <div>
        <h2>Dashboard</h2>
        <p class="muted">Resumen general de los fondos</p>
      </div>
      <div class="fx-pill" title="Fuente: ${rateInfo.source}">
        ${icon("refresh", 14)} 1 USD = <strong>${getRate().toFixed(2)}</strong> MXN
      </div>
    </div>

    <div class="grid grid-4">${fundsGrid}</div>

    ${estimatorCard()}

    <div class="grid grid-2">
      <div class="panel">
        <div class="panel-head"><h3>Inversión en casa</h3>${STATE_BADGE.en_progreso}</div>
        <div class="big-number">${fmtMXN(invertido)} <span class="of">de ${fmtMXN(meta)}</span></div>
        ${usdRef(invertido)}
        ${progressBar(casaPct)}
        <div class="muted small">${fmtPct(casaPct)} del costo conocido para casa habitable</div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Últimos movimientos</h3></div>
        ${recent.length ? movementMiniList(recent) : emptyState("Sin movimientos aún")}
      </div>
    </div>
  </section>`;
}

function fundProgress(name, value, meta, ic) {
  const pct = meta ? (value / meta) * 100 : 0;
  return `<div class="fund-card">
    <div class="fund-card-head">${icon(ic, 18)}<span>${name}</span></div>
    <div class="fund-amount">${fmtMXN(value)}</div>
    <div class="muted small">meta ${fmtMXN(meta)}</div>
    ${progressBar(pct)}
    <div class="fund-pct">${fmtPct(pct)}</div>
  </div>`;
}

function fundNu(nu) {
  return `<div class="fund-card">
    <div class="fund-card-head">${icon("wallet", 18)}<span>Nu (buffer)</span></div>
    <div class="fund-amount">${fmtMXN(nu)}</div>
    <div class="muted small">${usdRef(nu)}</div>
    <div class="fund-pct muted">disponible para enviar</div>
  </div>`;
}

function estimatorCard() {
  const t = estimateTimeline();
  const rows = t.metas
    .map((m) => {
      if (m.indefinido)
        return `<div class="est-row"><span class="est-name">${m.nombre}</span>
          <span class="est-val muted">Presupuesto por definir</span></div>`;
      if (!isFinite(m.mesesAcumulado) || m.mesesAcumulado == null)
        return `<div class="est-row"><span class="est-name">${m.nombre}</span>
          <span class="est-val warn">Ritmo de envíos insuficiente</span></div>`;
      return `<div class="est-row">
        <span class="est-name">${m.nombre}</span>
        <span class="est-val">
          <strong>${fmtMonthYear(m.fecha)}</strong>
          <span class="muted small">· ${fmtDuration(m.mesesAcumulado)}</span>
        </span>
      </div>`;
    })
    .join("");

  const note = t.insufficient
    ? `<p class="hint warn">${icon("alert", 14)} No hay ritmo de envíos suficiente en los últimos meses para estimar. Registra envíos para activar la proyección.</p>`
    : `<p class="hint">${icon("clock", 14)} Basado en un promedio de <strong>${fmtMXN(
        t.avgMonthly
      )}/mes</strong> (fuente: ${t.source}, últimos ${t.monthsSampled} meses).</p>`;

  return `<div class="panel estimator">
    <div class="panel-head"><h3>${icon("target", 18)} Estimador de tiempo</h3></div>
    <p class="muted small">Orden de prioridad: Fase 3 → Gimnasio → GBM (en serie).</p>
    <div class="est-list">${rows}</div>
    ${note}
  </div>`;
}

function movementMiniList(items) {
  return `<ul class="mini-list">${items
    .map(
      (m) => `<li>
      <div class="mini-main">
        <span class="mini-concept">${m.concept}</span>
        <span class="muted small">${fundLabel(m.fund)} · ${fmtDate(m.date)}</span>
      </div>
      <span class="amount ${m.isDiscount ? "neg" : "pos"}">${m.isDiscount ? "−" : "+"}${fmtMXN(
        m.amountMXN
      )}</span>
    </li>`
    )
    .join("")}</ul>`;
}

// ---------------------------------------------------------------------------
//  CASA
// ---------------------------------------------------------------------------
function casa(app) {
  const phases = phaseSummary();
  const invertido = casaInvertido();
  const meta = casaMeta();
  const f2 = fase2Detail();

  const phaseCards = phases
    .map((p) => {
      const editable = p.placeholder;
      const movs = store.getAllMovements().filter((m) => m.fund === p.id);
      const budgetTxt =
        p.presupuesto != null
          ? fmtMXN(p.presupuesto)
          : `<span class="warn">Pendiente</span>`;

      let progress = "";
      if (p.presupuesto) {
        progress = `${progressBar(p.pct)}
          <div class="muted small">${fmtMXN(p.neto)} aplicado · ${fmtPct(p.pct)}</div>`;
      }

      // Detalle especial Fase 2
      let special = "";
      if (p.id === "casa_fase2") {
        special = `<div class="f2-split">
          <div><span class="muted small">Total enviado por Paúl</span><strong>${fmtMXN(
            f2.enviado
          )}</strong></div>
          <div><span class="muted small">Aplicado a obra (neto)</span><strong>${fmtMXN(
            f2.neto
          )}</strong></div>
          <div><span class="muted small">Diferencia (anticipo + regalo)</span><strong>${fmtMXN(
            f2.diferencia
          )}</strong></div>
        </div>`;
      }

      return `<div class="panel phase">
        <div class="panel-head">
          <div><h3>${p.nombre}</h3><p class="muted small">${p.incluye}</p></div>
          ${STATE_BADGE[p.estado] || ""}
        </div>
        <div class="phase-budget">
          <span class="muted small">Presupuesto</span> ${budgetTxt}
          ${editable ? `<button class="link-btn" data-edit-budget="${p.id}" data-name="${p.nombre}">${icon("edit", 13)} Definir</button>` : ""}
        </div>
        ${special}
        ${progress}
        ${movs.length ? `<details class="phase-history"><summary>Ver ${movs.length} movimiento(s)</summary>${movementTable(movs)}</details>` : `<p class="muted small">Sin pagos registrados.</p>`}
      </div>`;
    })
    .join("");

  return `
  <section class="view">
    <div class="view-head">
      <div><h2>Casa Cuauhtémoc</h2><p class="muted">Terreno 2,000 m² · diseño industrial</p></div>
      <button class="btn btn-primary" data-add-mov>${icon("plus", 16)} Registrar pago</button>
    </div>

    <div class="grid grid-3">
      ${statCard({ label: "Invertido (neto)", value: fmtMXN(invertido), sub: usdRef(invertido), tone: "success" })}
      ${statCard({ label: "Meta casa habitable", value: fmtMXN(meta), sub: "presupuestos conocidos" })}
      ${statCard({ label: "Avance", value: fmtPct(meta ? (invertido / meta) * 100 : 0), tone: "accent" })}
    </div>
    ${progressBar(meta ? (invertido / meta) * 100 : 0)}

    <div class="phases">${phaseCards}</div>
  </section>`;
}

// ---------------------------------------------------------------------------
//  GBM
// ---------------------------------------------------------------------------
function gbm(app) {
  const proj = gbmProjection();
  const pct = (proj.balance / proj.meta) * 100;
  const movs = store.getAllMovements().filter((m) => m.fund === "gbm");

  return `
  <section class="view">
    <div class="view-head">
      <div><h2>Fondo GBM</h2><p class="muted">Inversión pasiva · 7% anual</p></div>
      <button class="btn btn-primary" data-add-mov="gbm">${icon("plus", 16)} Aportar</button>
    </div>

    <div class="grid grid-3">
      ${statCard({ label: "Saldo actual", value: fmtMXN(proj.balance), sub: usdRef(proj.balance), tone: "accent" })}
      ${statCard({ label: "Meta", value: fmtMXN(proj.meta), sub: fmtPct(pct) + " alcanzado" })}
      ${statCard({
        label: "Fecha estimada meta",
        value: proj.fecha ? fmtMonthYear(proj.fecha) : "—",
        sub: proj.months ? fmtDuration(proj.months) : "registra aportaciones",
      })}
    </div>
    ${progressBar(pct)}

    <div class="panel">
      <div class="panel-head"><h3>Proyección con interés compuesto (7%)</h3></div>
      ${lineChart(proj.points, proj.meta)}
    </div>

    <div class="grid grid-2">
      ${statCard({
        label: "Ingreso pasivo proyectado (4%)",
        value: fmtMXN(proj.ingresoPasivoAnual) + " / año",
        sub: `≈ ${fmtMXN(proj.ingresoPasivoMensual)} / mes`,
        tone: "success",
      })}
      <div class="panel">
        <div class="panel-head"><h3>Aportaciones</h3></div>
        ${movs.length ? movementTable(movs) : emptyState("Sin aportaciones aún", "Usa “Aportar” para registrar la primera.")}
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
//  GIMNASIO
// ---------------------------------------------------------------------------
function gym(app) {
  const balance = gymBalance();
  const meta = CONFIG.metas.gym;
  const pct = (balance / meta) * 100;
  const { avg } = avgMonthlyContribution(6);
  const remaining = Math.max(0, meta - balance);
  const months = avg > 0 ? remaining / avg : null;
  const fecha = months != null ? monthsFromNow(months) : null;
  const movs = store.getAllMovements().filter((m) => m.fund === "gym");

  return `
  <section class="view">
    <div class="view-head">
      <div><h2>Gimnasio / Bodega</h2><p class="muted">Bodega + equipamiento · post-2028</p></div>
      <button class="btn btn-primary" data-add-mov="gym">${icon("plus", 16)} Aportar</button>
    </div>

    <div class="grid grid-3">
      ${statCard({ label: "Saldo actual", value: fmtMXN(balance), sub: usdRef(balance), tone: "accent" })}
      ${statCard({ label: "Meta", value: fmtMXN(meta), sub: fmtPct(pct) + " alcanzado" })}
      ${statCard({
        label: "Fecha estimada",
        value: fecha ? fmtMonthYear(fecha) : "—",
        sub: months != null ? fmtDuration(months) + " al ritmo actual" : "registra envíos",
      })}
    </div>
    ${progressBar(pct)}

    <div class="panel">
      <div class="panel-head"><h3>Aportaciones</h3></div>
      ${movs.length ? movementTable(movs) : emptyState("Sin aportaciones aún", "Prioridad tercera, después de casa y GBM.")}
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
//  NU & ENVÍOS
// ---------------------------------------------------------------------------
function nu(app) {
  const nuData = store.getNu();
  const envios = store.getEnvios();
  const rate = getRate();

  const totUsd = envios.reduce((s, e) => s + e.usd, 0);
  const totMxn = envios.reduce((s, e) => s + e.mxn, 0);
  const avgRate = totUsd ? totMxn / totUsd : 0;
  const rates = envios.map((e) => e.rate).filter(Boolean);
  const best = rates.length ? Math.max(...rates) : 0;
  const worst = rates.length ? Math.min(...rates) : 0;

  return `
  <section class="view">
    <div class="view-head">
      <div><h2>Nu & Envíos</h2><p class="muted">Buffer de envíos USD → MXN</p></div>
      <button class="btn btn-primary" data-add-envio>${icon("send", 16)} Registrar envío</button>
    </div>

    <div class="grid grid-3">
      <div class="panel">
        <div class="panel-head"><h3>Saldo Nu</h3>
          <button class="icon-btn" data-edit-nu aria-label="Editar saldo">${icon("edit", 16)}</button>
        </div>
        <div class="big-number">${fmtMXN(nuData.balance)}</div>
        ${usdRef(nuData.balance)}
      </div>
      ${statCard({ label: "Total enviado (histórico)", value: fmtUSD(totUsd, true), sub: fmtMXN(totMxn) + " recibidos" })}
      ${statCard({ label: "Tipo de cambio promedio", value: avgRate ? avgRate.toFixed(4) : "—", sub: `oficial hoy: ${rate.toFixed(4)}` })}
    </div>

    <div class="grid grid-2">
      ${statCard({ label: "Mejor tipo de cambio", value: best ? best.toFixed(4) : "—", tone: "success" })}
      ${statCard({ label: "Peor tipo de cambio", value: worst ? worst.toFixed(4) : "—", tone: "warn" })}
    </div>

    <div class="panel">
      <div class="panel-head"><h3>Historial de envíos</h3></div>
      ${envios.length ? envioTable(envios) : emptyState("Aún no registras envíos", "Cada envío alimenta el estimador de tiempo.")}
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
//  HISTORIAL COMPLETO
// ---------------------------------------------------------------------------
function historial(app) {
  const all = store.getAllMovements();
  const funds = [...new Set(all.map((m) => m.fund))];
  const fundOpts = funds.map((f) => `<option value="${f}">${fundLabel(f)}</option>`).join("");

  return `
  <section class="view">
    <div class="view-head">
      <div><h2>Historial completo</h2><p class="muted">Todos los movimientos</p></div>
      <button class="btn btn-ghost" data-export>${icon("download", 16)} Exportar CSV</button>
    </div>

    <div class="filters">
      <select id="filter-fund"><option value="">Todos los fondos</option>${fundOpts}</select>
      <select id="filter-type">
        <option value="">Todos los tipos</option>
        <option value="in">Entradas</option>
        <option value="discount">Descuentos</option>
        <option value="historical">Datos históricos</option>
        <option value="new">Registros nuevos</option>
      </select>
      <input type="month" id="filter-month" />
    </div>

    <div class="panel" id="hist-table">${movementTable(all, true)}</div>
  </section>`;
}

// --- Tablas reutilizables ----------------------------------------------------
function movementTable(items, showFund = false) {
  if (!items.length) return emptyState("Sin movimientos");
  return `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>Fecha</th><th>Concepto</th>${showFund ? "<th>Fondo</th>" : ""}<th class="right">Monto</th><th></th>
    </tr></thead>
    <tbody>
    ${items
      .map(
        (m) => `<tr>
        <td>${fmtDate(m.date)}</td>
        <td>${m.concept}${m.notes ? `<span class="muted small block">${m.notes}</span>` : ""}</td>
        ${showFund ? `<td>${fundLabel(m.fund)}</td>` : ""}
        <td class="right amount ${m.isDiscount ? "neg" : "pos"}">${m.isDiscount ? "−" : "+"}${fmtMXN(m.amountMXN)}</td>
        <td class="right">${m.historical ? `<span class="tag">histórico</span>` : `<span class="tag tag-new">nuevo</span>`}</td>
      </tr>`
      )
      .join("")}
    </tbody>
  </table></div>`;
}

function envioTable(items) {
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Fecha</th><th>USD</th><th>T.C.</th><th>MXN</th><th>Plataforma</th><th>Destino</th></tr></thead>
    <tbody>
    ${items
      .map(
        (e) => `<tr>
        <td>${fmtDate(e.date)}</td>
        <td>${fmtUSD(e.usd, true)}</td>
        <td>${e.rate.toFixed(4)}</td>
        <td class="amount pos">${fmtMXN(e.mxn)}</td>
        <td>${e.platform}</td>
        <td>${fundLabel(e.fund)}</td>
      </tr>`
      )
      .join("")}
    </tbody>
  </table></div>`;
}

function monthsFromNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d;
}

// --- Wiring de eventos por vista --------------------------------------------
function wire(tab, root, app) {
  root.querySelectorAll("[data-add-mov]").forEach((b) => {
    b.onclick = () => {
      const fund = b.getAttribute("data-add-mov");
      openMovementForm(app.refresh, fund && fund !== "" ? fund : "casa_fase2");
    };
  });
  const envBtn = root.querySelector("[data-add-envio]");
  if (envBtn) envBtn.onclick = () => openEnvioForm(app.refresh);
  const nuBtn = root.querySelector("[data-edit-nu]");
  if (nuBtn) nuBtn.onclick = () => openNuForm(app.refresh);
  root.querySelectorAll("[data-edit-budget]").forEach((b) => {
    b.onclick = () =>
      openPhaseBudgetForm(b.getAttribute("data-edit-budget"), b.getAttribute("data-name"), app.refresh);
  });

  if (tab === "historial") wireHistorial(root, app);
}

function wireHistorial(root, app) {
  const all = store.getAllMovements();
  const fFund = root.querySelector("#filter-fund");
  const fType = root.querySelector("#filter-type");
  const fMonth = root.querySelector("#filter-month");
  const tableHost = root.querySelector("#hist-table");

  const apply = () => {
    let rows = all;
    if (fFund.value) rows = rows.filter((m) => m.fund === fFund.value);
    if (fMonth.value) rows = rows.filter((m) => (m.date || "").startsWith(fMonth.value));
    switch (fType.value) {
      case "in": rows = rows.filter((m) => !m.isDiscount); break;
      case "discount": rows = rows.filter((m) => m.isDiscount); break;
      case "historical": rows = rows.filter((m) => m.historical); break;
      case "new": rows = rows.filter((m) => !m.historical); break;
    }
    tableHost.innerHTML = movementTable(rows, true);
  };
  [fFund, fType, fMonth].forEach((el) => (el.onchange = apply));

  root.querySelector("[data-export]").onclick = () => exportCSV(all);
}

function exportCSV(items) {
  const headers = ["Fecha", "Concepto", "Fondo", "Monto MXN", "Descuento", "Notas", "Origen"];
  const lines = items.map((m) =>
    [m.date, m.concept, fundLabel(m.fund), m.amountMXN, m.isDiscount ? "si" : "no", (m.notes || "").replace(/"/g, "'"), m.historical ? "historico" : "nuevo"]
      .map((c) => `"${c}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casa-cuauhtemoc-movimientos.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const VIEWS = { dashboard, casa, gbm, gym, nu, historial };

export function renderView(tab, root, app) {
  const fn = VIEWS[tab] || dashboard;
  root.innerHTML = fn(app);
  root.classList.remove("fade-in");
  void root.offsetWidth;
  root.classList.add("fade-in");
  wire(tab, root, app);
}
