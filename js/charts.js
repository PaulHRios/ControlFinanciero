// ============================================================================
//  Gráficas SVG ligeras (sin dependencias)
// ============================================================================
import { fmtMXN } from "./format.js";

/**
 * Gráfica de línea de área. points: [{month, value}], meta: número.
 * Devuelve un string SVG.
 */
export function lineChart(points, meta, { width = 640, height = 220 } = {}) {
  if (!points || points.length < 2) {
    return `<div class="chart-empty">Datos insuficientes para proyectar.</div>`;
  }
  const padL = 8, padR = 8, padT = 16, padB = 24;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const maxX = points[points.length - 1].month || 1;
  const maxY = Math.max(meta, ...points.map((p) => p.value)) * 1.02;

  const x = (m) => padL + (m / maxX) * w;
  const y = (v) => padT + h - (v / maxY) * h;

  const line = points.map((p) => `${x(p.month).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${padL},${padT + h} ${line} ${x(maxX).toFixed(1)},${padT + h}`;

  const metaY = y(meta).toFixed(1);

  return `
  <svg viewBox="0 0 ${width} ${height}" class="chart" preserveAspectRatio="none" role="img" aria-label="Proyección GBM">
    <defs>
      <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="${padL}" x2="${width - padR}" y1="${metaY}" y2="${metaY}"
          stroke="var(--success)" stroke-dasharray="4 4" stroke-width="1" opacity="0.7"/>
    <text x="${width - padR}" y="${Number(metaY) - 6}" text-anchor="end"
          fill="var(--success)" font-size="11">Meta ${fmtMXN(meta)}</text>
    <polygon points="${area}" fill="url(#areaGrad)"/>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2"
              stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

/** Barra de progreso semántica. */
export function progressBar(pct, { tone = "auto" } = {}) {
  const p = Math.max(0, Math.min(100, pct || 0));
  let color = "var(--accent)";
  if (tone === "auto") {
    if (p >= 100) color = "var(--success)";
    else if (p >= 50) color = "var(--accent)";
    else color = "var(--warning)";
  }
  return `<div class="progress" role="progressbar" aria-valuenow="${p.toFixed(0)}">
    <div class="progress-fill" style="width:${p}%;background:${color}"></div>
  </div>`;
}
