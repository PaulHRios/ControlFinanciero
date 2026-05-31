// ============================================================================
//  FORMULARIOS — registrar/borrar movimientos, editar presupuestos
// ============================================================================
import * as store from "./store.js";
import { modal, confirmar, toast, icon } from "./ui.js";
import { PHASES, PLATAFORMAS, label } from "./data.js";
import { mxn, hoy } from "./format.js";

const v = (id) => document.getElementById(id).value.trim();
const num = (id) => parseFloat(document.getElementById(id).value) || 0;

const faseOptions = (sel) =>
  PHASES.map((p) => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${p.nombre}</option>`).join("");

// ---------------------------------------------------------------------------
//  ENVÍO de Paúl → cuenta de mamá (transfer)
// ---------------------------------------------------------------------------
export function formEnvio(onDone) {
  const m = modal({
    title: "Registrar envío a mamá",
    body: `
      <p class="form-hint">${icon("arrowUp", 14)} Dinero que envías a la cuenta de tu mamá. Suma a su saldo disponible.</p>
      <div class="form-grid">
        <label class="field"><span>Fecha</span><input type="date" id="f-date" value="${hoy()}"></label>
        <label class="field"><span>Monto (MXN)</span><input type="number" id="f-monto" min="0" step="0.01" placeholder="0"></label>
        <label class="field"><span>Plataforma</span><select id="f-plat">${PLATAFORMAS.map((p) => `<option>${p}</option>`).join("")}</select></label>
        <label class="field"><span>Concepto</span><input type="text" id="f-concepto" value="Transferencia"></label>
        <label class="field col-2"><span>Notas (opcional)</span><input type="text" id="f-notas" placeholder="..."></label>
      </div>`,
    footer: btnGuardar(),
  });
  wireSave(m, onDone, () => {
    const monto = num("f-monto");
    if (!(monto > 0)) return toast("Captura un monto válido.", "err"), null;
    return { date: v("f-date"), kind: "transfer", concepto: v("f-concepto") || "Transferencia", monto, notas: `${v("f-plat")}${v("f-notas") ? " · " + v("f-notas") : ""}` };
  }, (mv) => `Vas a registrar un envío de <b>${mxn(mv.monto)}</b> a la cuenta de tu mamá.`);
}

// ---------------------------------------------------------------------------
//  PAGO a la obra (pago) — mamá saca de su disponible y paga una fase
// ---------------------------------------------------------------------------
export function formPago(onDone, faseSel = "casa_fase2") {
  const disp = store.cuentaMama().disponible;
  const m = modal({
    title: "Registrar pago a la obra",
    body: `
      <p class="form-hint">${icon("arrowDown", 14)} Tu mamá paga al constructor. Resta de su disponible (${mxn(disp)}) y suma a lo pagado de la fase.</p>
      <div class="form-grid">
        <label class="field"><span>Fecha</span><input type="date" id="f-date" value="${hoy()}"></label>
        <label class="field"><span>Monto (MXN)</span><input type="number" id="f-monto" min="0" step="0.01" placeholder="0"></label>
        <label class="field col-2"><span>Fase</span><select id="f-fase">${faseOptions(faseSel)}</select></label>
        <label class="field"><span>Concepto</span><input type="text" id="f-concepto" value="Pago a obra"></label>
        <label class="field"><span>Notas (opcional)</span><input type="text" id="f-notas" placeholder="..."></label>
      </div>`,
    footer: btnGuardar(),
  });
  wireSave(m, onDone, () => {
    const monto = num("f-monto");
    if (!(monto > 0)) return toast("Captura un monto válido.", "err"), null;
    if (monto > disp + 0.01)
      return toast(`No hay suficiente disponible (${mxn(disp)}).`, "err"), null;
    return { date: v("f-date"), kind: "pago", fase: v("f-fase"), concepto: v("f-concepto") || "Pago a obra", monto, notas: v("f-notas") };
  }, (mv) => `Tu mamá pagará <b>${mxn(mv.monto)}</b> a <b>${label(mv.fase)}</b>.`);
}

// ---------------------------------------------------------------------------
//  REGALO / gasto distinto (regalo) — resta del disponible
// ---------------------------------------------------------------------------
export function formRegalo(onDone) {
  const disp = store.cuentaMama().disponible;
  const m = modal({
    title: "Registrar otro gasto / regalo",
    body: `
      <p class="form-hint">${icon("gift", 14)} Dinero que tu mamá usó en algo distinto a la obra. Resta de su disponible (${mxn(disp)}).</p>
      <div class="form-grid">
        <label class="field"><span>Fecha</span><input type="date" id="f-date" value="${hoy()}"></label>
        <label class="field"><span>Monto (MXN)</span><input type="number" id="f-monto" min="0" step="0.01" placeholder="0"></label>
        <label class="field col-2"><span>Concepto</span><input type="text" id="f-concepto" value="Regalo"></label>
        <label class="field col-2"><span>Notas (opcional)</span><input type="text" id="f-notas" placeholder="..."></label>
      </div>`,
    footer: btnGuardar(),
  });
  wireSave(m, onDone, () => {
    const monto = num("f-monto");
    if (!(monto > 0)) return toast("Captura un monto válido.", "err"), null;
    return { date: v("f-date"), kind: "regalo", concepto: v("f-concepto") || "Regalo", monto, notas: v("f-notas") };
  }, (mv) => `Vas a registrar un gasto de <b>${mxn(mv.monto)}</b> fuera de la obra.`);
}

// ---------------------------------------------------------------------------
//  APORTE a fondo (GBM / Gimnasio)
// ---------------------------------------------------------------------------
export function formAporte(onDone, fund = "gbm") {
  const nombre = fund === "gbm" ? "GBM" : "Gimnasio";
  const m = modal({
    title: `Aportar a ${nombre}`,
    body: `
      <p class="form-hint">${icon("trending", 14)} Aportación al fondo ${nombre}.</p>
      <div class="form-grid">
        <label class="field"><span>Monto (MXN)</span><input type="number" id="f-monto" min="0" step="0.01" placeholder="0"></label>
        <label class="field"><span>Notas (opcional)</span><input type="text" id="f-notas" placeholder="..."></label>
      </div>`,
    footer: btnGuardar(),
  });
  m.el.querySelector("[data-save]").onclick = async () => {
    const monto = num("f-monto");
    if (!(monto > 0)) return toast("Captura un monto válido.", "err");
    m.close();
    const ok = await confirmar({ title: "Confirmar aportación", message: `Aportarás <b>${mxn(monto)}</b> a ${nombre}.`, ok: "Guardar" });
    if (!ok) return;
    await store.addToFund(fund, monto, v("f-notas"));
    toast("Aportación registrada.");
    onDone?.();
  };
}

// ---------------------------------------------------------------------------
//  Editar presupuesto de fase (placeholders fase 0 / fase 3)
// ---------------------------------------------------------------------------
export function formPresupuesto(faseId, faseNombre, onDone) {
  const actual = store.budget(faseId);
  const m = modal({
    title: `Presupuesto · ${faseNombre}`,
    body: `<div class="form-grid"><label class="field col-2"><span>Presupuesto total (MXN)</span>
      <input type="number" id="f-monto" min="0" step="0.01" value="${actual ?? ""}" placeholder="0"></label></div>`,
    footer: btnGuardar("Guardar presupuesto"),
  });
  m.el.querySelector("[data-save]").onclick = async () => {
    await store.setBudget(faseId, num("f-monto"));
    m.close();
    toast("Presupuesto actualizado.");
    onDone?.();
  };
}

// ---------------------------------------------------------------------------
//  Borrar un movimiento nuevo (los históricos no se pueden borrar)
// ---------------------------------------------------------------------------
export async function borrarMovimiento(id, onDone) {
  const ok = await confirmar({
    title: "Borrar movimiento",
    message: "¿Seguro que quieres borrar este registro? Esta acción no se puede deshacer.",
    ok: "Borrar",
    danger: true,
  });
  if (!ok) return;
  await store.deleteMove(id);
  toast("Movimiento borrado.");
  onDone?.();
}

// --- Helpers compartidos -----------------------------------------------------
function btnGuardar(text = "Guardar") {
  return `<button class="btn ghost" data-close>Cancelar</button>
          <button class="btn primary" data-save>${text}</button>`;
}

function wireSave(m, onDone, build, mensaje) {
  m.el.querySelector("[data-save]").onclick = async () => {
    const mv = build();
    if (!mv) return;
    m.close();
    const ok = await confirmar({ title: "Confirmar", message: mensaje(mv) + " Podrás borrarlo después si te equivocas.", ok: "Guardar" });
    if (!ok) return;
    await store.addMove(mv);
    toast("Registrado correctamente.");
    onDone?.();
  };
}
