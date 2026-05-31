// ============================================================================
//  VISTAS — render de cada pestaña
// ============================================================================
import * as store from "./store.js";
import { CONFIG } from "./config.js";
import { PHASES, label } from "./data.js";
import { mxn, usd, pct, fecha, mesAno, duracion } from "./format.js";
import { getRate, aUSD } from "./fx.js";
import { icon, vacio } from "./ui.js";
import {
  formEnvio, formPago, formRegalo, formAporte, formPresupuesto, borrarMovimiento,
} from "./forms.js";

const ESTADO = {
  completada: `<span class="chip chip-ok">Completada</span>`,
  en_progreso: `<span class="chip chip-blue">En progreso</span>`,
  pendiente: `<span class="chip chip-warn">Pendiente</span>`,
};

const KIND = {
  transfer: { label: "Envío", ic: "arrowUp", cls: "in" },
  pago: { label: "Pago a obra", ic: "arrowDown", cls: "out" },
  regalo: { label: "Otro gasto", ic: "gift", cls: "out" },
  aporte: { label: "Aportación", ic: "trending", cls: "in" },
};

const refUSD = (m) => `<span class="usd">≈ ${usd(aUSD(m))}</span>`;

// Barra de progreso
function barra(p, tono) {
  const v = Math.max(0, Math.min(100, p || 0));
  const color = tono || (v >= 100 ? "var(--ok)" : v >= 50 ? "var(--blue)" : "var(--warn)");
  return `<div class="bar"><div class="bar-fill" style="width:${v}%;background:${color}"></div></div>`;
}

// ===========================================================================
//  INICIO
// ===========================================================================
function inicio(app) {
  const c = store.cuentaMama();
  const pagado = store.casaPagado();
  const meta = store.casaMeta();
  const recientes = store.allMoves().slice(0, 5);

  return `
  <div class="view">
    <header class="vhead">
      <div><h1>Resumen</h1><p class="sub">Estado general de tus fondos</p></div>
      <div class="fx">${icon("trending", 14)} 1 USD = <b>${getRate().toFixed(2)}</b> MXN</div>
    </header>

    ${cuentaMamaCard(c)}

    <div class="cards-3">
      ${miniCard("Casa", "home", pagado, meta)}
      ${miniCard("GBM", "trending", store.fundBalance("gbm"), CONFIG.metas.gbm)}
      ${miniCard("Gimnasio", "dumbbell", store.fundBalance("gym"), CONFIG.metas.gym)}
    </div>

    ${estimadorCard()}

    <section class="panel">
      <div class="panel-head"><h2>Últimos movimientos</h2></div>
      ${recientes.length ? listaMovs(recientes) : vacio("Sin movimientos aún")}
    </section>
  </div>`;
}

// Tarjeta protagonista: la cuenta de mamá
function cuentaMamaCard(c) {
  return `
  <section class="hero">
    <div class="hero-top">
      <span class="hero-label">${icon("wallet", 16)} Disponible en la cuenta de mamá</span>
    </div>
    <div class="hero-amount">${mxn(c.disponible)}</div>
    <div class="hero-sub">${refUSD(c.disponible)} · listo para pagar a la obra</div>
    <div class="hero-grid">
      <div class="hero-stat"><span>${icon("arrowUp", 13)} Recibido</span><b>${mxn(c.recibido)}</b></div>
      <div class="hero-stat"><span>${icon("arrowDown", 13)} Pagado a obra</span><b>${mxn(c.pagado)}</b></div>
      <div class="hero-stat"><span>${icon("gift", 13)} Otros gastos</span><b>${mxn(c.regalado)}</b></div>
    </div>
  </section>`;
}

function miniCard(nombre, ic, valor, meta) {
  const p = meta ? (valor / meta) * 100 : 0;
  return `<div class="mini">
    <div class="mini-head">${icon(ic, 16)}<span>${nombre}</span></div>
    <div class="mini-amount">${mxn(valor)}</div>
    <div class="mini-meta">meta ${mxn(meta)}</div>
    ${barra(p)}
    <div class="mini-pct">${pct(p)}</div>
  </div>`;
}

function estimadorCard() {
  const e = store.estimador();
  const filas = e.metas
    .map((m) => {
      if (m.indefinido)
        return row(m.nombre, `<span class="muted">Presupuesto por definir</span>`);
      if (!isFinite(m.meses))
        return row(m.nombre, `<span class="warn-text">Sin ritmo de envíos suficiente</span>`);
      return row(m.nombre, `<b>${mesAno(m.fecha)}</b> <span class="muted">· ${duracion(m.mesesAcum)}</span>`);
    })
    .join("");
  const nota = e.insuficiente
    ? `<p class="form-hint warn-text">${icon("clock", 13)} Registra envíos para activar la proyección.</p>`
    : `<p class="form-hint">${icon("clock", 13)} Según un promedio de <b>${mxn(e.avg)}/mes</b> en envíos (últimos 6 meses).</p>`;
  return `<section class="panel">
    <div class="panel-head"><h2>${icon("target", 16)} ¿Cuándo termino cada meta?</h2></div>
    <p class="sub">En orden: Fase 3 → Gimnasio → GBM (una después de la otra).</p>
    <div class="rows">${filas}</div>
    ${nota}
  </section>`;
  function row(a, b) {
    return `<div class="row"><span>${a}</span><span class="row-val">${b}</span></div>`;
  }
}

// ===========================================================================
//  CASA
// ===========================================================================
function casa(app) {
  const fases = store.resumenFases();
  const c = store.cuentaMama();
  const pagado = store.casaPagado();
  const meta = store.casaMeta();

  // Agrupar los pagos por fase en una sola pasada (evita re-escanear por fase).
  const pagosPorFase = {};
  for (const m of store.allMoves()) {
    if (m.kind === "pago") (pagosPorFase[m.fase] ??= []).push(m);
  }
  const tarjetas = fases.map((f) => faseCard(f, pagosPorFase[f.id] || [])).join("");

  return `
  <div class="view">
    <header class="vhead">
      <div><h1>Casa Cuauhtémoc</h1><p class="sub">Terreno 2,000 m² · diseño industrial</p></div>
      <button class="btn primary" data-act="pago">${icon("plus", 16)} Registrar pago</button>
    </header>

    <section class="hero compact">
      <div class="hero-grid wide">
        <div class="hero-stat"><span>Pagado a la casa</span><b class="ok-text">${mxn(pagado)}</b></div>
        <div class="hero-stat"><span>Meta (presupuestos)</span><b>${mxn(meta)}</b></div>
        <div class="hero-stat"><span>Avance</span><b class="blue-text">${pct(meta ? (pagado / meta) * 100 : 0)}</b></div>
        <div class="hero-stat"><span>Disponible para pagar</span><b>${mxn(c.disponible)}</b></div>
      </div>
      ${barra(meta ? (pagado / meta) * 100 : 0)}
    </section>

    <div class="fases">${tarjetas}</div>
  </div>`;
}

function faseCard(f, movs) {
  let cuerpo = "";
  if (f.presupuesto != null) {
    cuerpo = `
      <div class="fase-nums">
        <div><span>Pagado</span><b class="ok-text">${mxn(f.pagado)}</b></div>
        <div><span>Presupuesto</span><b>${mxn(f.presupuesto)}</b></div>
        <div><span>Falta por pagar</span><b class="warn-text">${mxn(f.falta)}</b></div>
      </div>
      ${barra(f.pct)}
      <div class="mini-pct">${pct(f.pct)} pagado</div>`;
  } else {
    cuerpo = `<div class="fase-nums">
        <div><span>Pagado</span><b class="ok-text">${mxn(f.pagado)}</b></div>
        <div><span>Presupuesto</span><b class="muted">Pendiente</b></div>
      </div>
      <button class="btn ghost sm" data-budget="${f.id}" data-name="${f.nombre}">${icon("edit", 13)} Definir presupuesto</button>`;
  }

  return `<section class="panel fase">
    <div class="panel-head">
      <div><h2>${f.nombre}</h2><p class="sub">${f.incluye}</p></div>
      ${ESTADO[f.estado] || ""}
    </div>
    ${cuerpo}
    ${movs.length ? `<details><summary>Ver ${movs.length} pago(s)</summary>${listaMovs(movs)}</details>` : ""}
  </section>`;
}

// ===========================================================================
//  GBM
// ===========================================================================
function gbm(app) {
  const p = store.proyeccionGBM();
  const porc = (p.saldo / p.meta) * 100;
  const movs = store.allMoves().filter((m) => m.kind === "aporte" && m.fund === "gbm");

  return `
  <div class="view">
    <header class="vhead">
      <div><h1>Fondo GBM</h1><p class="sub">Inversión pasiva · 7% anual</p></div>
      <button class="btn primary" data-act="aporte-gbm">${icon("plus", 16)} Aportar</button>
    </header>

    <div class="cards-3">
      ${stat("Saldo actual", mxn(p.saldo), refUSD(p.saldo), "blue")}
      ${stat("Meta", mxn(p.meta), pct(porc) + " alcanzado")}
      ${stat("Fecha estimada", p.fecha ? mesAno(p.fecha) : "—", p.meses ? duracion(p.meses) : "registra aportaciones")}
    </div>
    ${barra(porc)}

    <section class="panel">
      <div class="panel-head"><h2>Proyección con interés compuesto</h2></div>
      ${grafica(p.puntos, p.meta)}
    </section>

    <div class="cards-2">
      ${stat("Ingreso pasivo (4%)", mxn(p.ingresoAnual) + " /año", `≈ ${mxn(p.ingresoMensual)} /mes`, "ok")}
      <section class="panel">
        <div class="panel-head"><h2>Aportaciones</h2></div>
        ${movs.length ? listaMovs(movs) : vacio("Sin aportaciones aún")}
      </section>
    </div>
  </div>`;
}

// ===========================================================================
//  GIMNASIO
// ===========================================================================
function gym(app) {
  const saldo = store.fundBalance("gym");
  const meta = CONFIG.metas.gym;
  const porc = (saldo / meta) * 100;
  const movs = store.allMoves().filter((m) => m.kind === "aporte" && m.fund === "gym");

  return `
  <div class="view">
    <header class="vhead">
      <div><h1>Gimnasio / Bodega</h1><p class="sub">Bodega + equipamiento · post-2028</p></div>
      <button class="btn primary" data-act="aporte-gym">${icon("plus", 16)} Aportar</button>
    </header>

    <div class="cards-3">
      ${stat("Saldo actual", mxn(saldo), refUSD(saldo), "blue")}
      ${stat("Meta", mxn(meta), pct(porc) + " alcanzado")}
      ${stat("Prioridad", "Tercera", "después de casa y GBM")}
    </div>
    ${barra(porc)}

    <section class="panel">
      <div class="panel-head"><h2>Aportaciones</h2></div>
      ${movs.length ? listaMovs(movs) : vacio("Sin aportaciones aún", "Prioridad tercera, después de casa y GBM.")}
    </section>
  </div>`;
}

// ===========================================================================
//  HISTORIAL
// ===========================================================================
function historial(app) {
  const all = store.allMoves();
  return `
  <div class="view">
    <header class="vhead">
      <div><h1>Historial</h1><p class="sub">Todos los movimientos</p></div>
      <button class="btn ghost" data-export>${icon("download", 16)} CSV</button>
    </header>

    <div class="filtros">
      <select id="fl-tipo">
        <option value="">Todos los tipos</option>
        <option value="transfer">Envíos</option>
        <option value="pago">Pagos a obra</option>
        <option value="regalo">Otros gastos</option>
        <option value="aporte">Aportaciones</option>
      </select>
      <input type="month" id="fl-mes">
    </div>

    <section class="panel" id="hist">${listaMovs(all)}</section>
  </div>`;
}

// --- Lista de movimientos (componente compartido) ---------------------------
function listaMovs(items) {
  if (!items.length) return vacio("Sin movimientos");
  return `<ul class="movs">${items
    .map((m) => {
      const k = KIND[m.kind] || KIND.transfer;
      const signo = k.cls === "out" ? "−" : "+";
      const destino = m.fase ? " · " + label(m.fase) : m.fund ? " · " + label(m.fund) : "";
      return `<li class="mov">
        <div class="mov-ic ${k.cls}">${icon(k.ic, 15)}</div>
        <div class="mov-main">
          <span class="mov-concepto">${m.concepto || k.label}</span>
          <span class="mov-meta">${k.label}${destino} · ${fecha(m.date)}${m.notas ? " · " + m.notas : ""}</span>
        </div>
        <span class="mov-monto ${k.cls}">${signo}${mxn(m.monto)}</span>
        ${m.historical
          ? `<span class="tag">histórico</span>`
          : `<button class="ghost-icon del" data-del="${m.id}" aria-label="Borrar">${icon("trash", 15)}</button>`}
      </li>`;
    })
    .join("")}</ul>`;
}

// --- Tarjetitas auxiliares ---------------------------------------------------
function stat(label, valor, sub, tono) {
  return `<div class="panel stat ${tono ? "t-" + tono : ""}">
    <span class="stat-label">${label}</span>
    <span class="stat-val">${valor}</span>
    ${sub ? `<span class="stat-sub">${sub}</span>` : ""}
  </div>`;
}

// --- Gráfica SVG de área -----------------------------------------------------
function grafica(puntos, meta) {
  if (!puntos || puntos.length < 2) return `<div class="empty"><p class="empty-sub">Datos insuficientes para proyectar.</p></div>`;
  const W = 640, H = 200, pad = 10;
  const maxX = puntos[puntos.length - 1].mes || 1;
  const maxY = meta * 1.02;
  const x = (m) => pad + (m / maxX) * (W - 2 * pad);
  const y = (val) => H - pad - (val / maxY) * (H - 2 * pad);
  const line = puntos.map((p) => `${x(p.mes).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${x(maxX).toFixed(1)},${H - pad}`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="none">
    <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="var(--blue)" stop-opacity=".3"/>
      <stop offset="100%" stop-color="var(--blue)" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="${area}" fill="url(#g)"/>
    <polyline points="${line}" fill="none" stroke="var(--blue)" stroke-width="2"/>
  </svg>`;
}

// --- Wiring de acciones por vista -------------------------------------------
function wire(tab, root, app) {
  root.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = () => {
      const a = b.dataset.act;
      if (a === "pago") formPago(app.refresh);
      else if (a === "aporte-gbm") formAporte(app.refresh, "gbm");
      else if (a === "aporte-gym") formAporte(app.refresh, "gym");
    };
  });
  root.querySelectorAll("[data-budget]").forEach((b) => {
    b.onclick = () => formPresupuesto(b.dataset.budget, b.dataset.name, app.refresh);
  });
  root.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => borrarMovimiento(b.dataset.del, app.refresh);
  });

  if (tab === "historial") wireHistorial(root, app);
}

function wireHistorial(root, app) {
  const all = store.allMoves();
  const tipo = root.querySelector("#fl-tipo");
  const mes = root.querySelector("#fl-mes");
  const host = root.querySelector("#hist");
  const aplicar = () => {
    let r = all;
    if (tipo.value) r = r.filter((m) => m.kind === tipo.value);
    if (mes.value) r = r.filter((m) => (m.date || "").startsWith(mes.value));
    host.innerHTML = listaMovs(r);
    host.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => borrarMovimiento(b.dataset.del, app.refresh)));
  };
  tipo.onchange = aplicar;
  mes.onchange = aplicar;
  root.querySelector("[data-export]").onclick = () => exportCSV(all);
}

function exportCSV(items) {
  const head = ["Fecha", "Tipo", "Concepto", "Fase/Fondo", "Monto MXN", "Notas", "Origen"];
  const rows = items.map((m) =>
    [m.date, KIND[m.kind]?.label || m.kind, m.concepto, label(m.fase || m.fund || ""), m.monto, (m.notas || "").replace(/"/g, "'"), m.historical ? "historico" : "nuevo"]
      .map((c) => `"${c}"`).join(",")
  );
  const csv = "﻿" + [head.join(","), ...rows].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "casa-cuauhtemoc.csv";
  a.click();
}

const VIEWS = { inicio, casa, gbm, gym, historial };

export function render(tab, root, app) {
  const fn = VIEWS[tab] || inicio;
  root.innerHTML = fn(app);
  root.classList.remove("fade");
  void root.offsetWidth;
  root.classList.add("fade");
  wire(tab, root, app);
}
