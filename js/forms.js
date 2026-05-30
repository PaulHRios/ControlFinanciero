// ============================================================================
//  Formularios: nuevo movimiento, nuevo envío, editar Nu, editar presupuesto
// ============================================================================
import { store } from "./store.js";
import { openModal, confirmDialog, toast } from "./ui.js";
import { FUND_OPTIONS, CONCEPT_OPTIONS, PLATFORM_OPTIONS } from "./funds.js";
import { fmtMXN, fmtUSD, todayISO } from "./format.js";
import { getRate } from "./fx.js";

const opt = (o, sel) =>
  o
    .map((x) => {
      const v = typeof x === "string" ? x : x.value;
      const l = typeof x === "string" ? x : x.label;
      return `<option value="${v}" ${v === sel ? "selected" : ""}>${l}</option>`;
    })
    .join("");

// --- Nuevo movimiento --------------------------------------------------------
export function openMovementForm(onDone, preselectFund = "casa_fase2") {
  const { close } = openModal({
    title: "Registrar movimiento",
    body: `
      <form id="mv-form" class="form-grid">
        <label class="field"><span>Fecha</span>
          <input type="date" id="mv-date" value="${todayISO()}" required></label>
        <label class="field"><span>Concepto</span>
          <select id="mv-concept">${opt(CONCEPT_OPTIONS, "Transferencia")}</select></label>
        <label class="field"><span>Fondo destino</span>
          <select id="mv-fund">${opt(FUND_OPTIONS, preselectFund)}</select></label>
        <label class="field"><span>Monto (MXN)</span>
          <input type="number" id="mv-amount" min="0" step="0.01" placeholder="0.00" required></label>
        <label class="field field-full"><span>Notas (opcional)</span>
          <input type="text" id="mv-notes" placeholder="Detalle..."></label>
        <label class="check-field field-full">
          <input type="checkbox" id="mv-discount">
          <span>Es descuento / devolución (resta del total)</span></label>
      </form>`,
    actions: `
      <button class="btn btn-ghost" data-cancel>Cancelar</button>
      <button class="btn btn-primary" data-save>Guardar</button>`,
  });

  document.querySelector("[data-cancel]").onclick = close;
  document.querySelector("[data-save]").onclick = async () => {
    const date = val("mv-date");
    const amount = parseFloat(val("mv-amount"));
    if (!date || !(amount > 0)) {
      toast("Completa fecha y monto válido.", "error");
      return;
    }
    const mv = {
      date,
      concept: val("mv-concept"),
      fund: val("mv-fund"),
      amountMXN: amount,
      isDiscount: document.getElementById("mv-discount").checked,
      notes: val("mv-notes"),
    };
    close();
    const ok = await confirmDialog({
      title: "Confirmar registro",
      message: `Vas a registrar <strong>${mv.isDiscount ? "−" : "+"}${fmtMXN(
        amount
      )}</strong>. Este movimiento <strong>no podrá editarse</strong> después de guardarse.`,
      confirmLabel: "Guardar definitivamente",
    });
    if (!ok) return;
    await store.addMovement(mv);
    toast("Movimiento registrado.");
    onDone && onDone();
  };
}

// --- Nuevo envío USD → MXN ---------------------------------------------------
export function openEnvioForm(onDone) {
  const rate = getRate();
  const { close } = openModal({
    title: "Registrar envío USD → MXN",
    body: `
      <form id="env-form" class="form-grid">
        <label class="field"><span>Fecha</span>
          <input type="date" id="env-date" value="${todayISO()}" required></label>
        <label class="field"><span>Monto enviado (USD)</span>
          <input type="number" id="env-usd" min="0" step="0.01" placeholder="0.00" required></label>
        <label class="field"><span>Tipo de cambio</span>
          <input type="number" id="env-rate" min="0" step="0.0001" value="${rate.toFixed(4)}"></label>
        <label class="field"><span>Recibido (MXN)</span>
          <input type="number" id="env-mxn" min="0" step="0.01" placeholder="auto" readonly></label>
        <label class="field"><span>Plataforma</span>
          <select id="env-platform">${opt(PLATFORM_OPTIONS, "Felix Pago")}</select></label>
        <label class="field"><span>Fondo destino</span>
          <select id="env-fund">${opt(FUND_OPTIONS, "casa_fase2")}</select></label>
        <label class="field field-full"><span>Notas (opcional)</span>
          <input type="text" id="env-notes" placeholder="Detalle..."></label>
      </form>`,
    actions: `
      <button class="btn btn-ghost" data-cancel>Cancelar</button>
      <button class="btn btn-primary" data-save>Guardar envío</button>`,
  });

  const recalc = () => {
    const usd = parseFloat(val("env-usd")) || 0;
    const r = parseFloat(val("env-rate")) || 0;
    document.getElementById("env-mxn").value = (usd * r).toFixed(2);
  };
  document.getElementById("env-usd").oninput = recalc;
  document.getElementById("env-rate").oninput = recalc;

  document.querySelector("[data-cancel]").onclick = close;
  document.querySelector("[data-save]").onclick = async () => {
    const usd = parseFloat(val("env-usd"));
    const r = parseFloat(val("env-rate"));
    if (!(usd > 0) || !(r > 0)) {
      toast("Captura un monto USD y tipo de cambio válidos.", "error");
      return;
    }
    const env = {
      date: val("env-date"),
      usd,
      rate: r,
      mxn: usd * r,
      platform: val("env-platform"),
      fund: val("env-fund"),
      notes: val("env-notes"),
    };
    close();
    const ok = await confirmDialog({
      title: "Confirmar envío",
      message: `Enviaste <strong>${fmtUSD(usd, true)}</strong> a un tipo de cambio de
        <strong>${r.toFixed(4)}</strong> = <strong>${fmtMXN(env.mxn)}</strong>.
        Este registro no podrá editarse.`,
      confirmLabel: "Guardar envío",
    });
    if (!ok) return;
    await store.addEnvio(env);
    toast("Envío registrado.");
    onDone && onDone();
  };
}

// --- Editar saldo Nu ---------------------------------------------------------
export function openNuForm(onDone) {
  const nu = store.getNu();
  const { close } = openModal({
    title: "Actualizar saldo Nu",
    body: `
      <form class="form-grid">
        <label class="field field-full"><span>Saldo actual en Nu (MXN)</span>
          <input type="number" id="nu-balance" min="0" step="0.01" value="${nu.balance}"></label>
        <label class="field field-full"><span>Nota (opcional)</span>
          <input type="text" id="nu-note" placeholder="Motivo del ajuste..."></label>
      </form>`,
    actions: `
      <button class="btn btn-ghost" data-cancel>Cancelar</button>
      <button class="btn btn-primary" data-save>Guardar</button>`,
  });
  document.querySelector("[data-cancel]").onclick = close;
  document.querySelector("[data-save]").onclick = async () => {
    await store.setNu(parseFloat(val("nu-balance")) || 0, val("nu-note"));
    close();
    toast("Saldo Nu actualizado.");
    onDone && onDone();
  };
}

// --- Editar presupuesto de fase (placeholders fase 0 / fase 3) ---------------
export function openPhaseBudgetForm(phaseId, phaseName, onDone) {
  const current = store.getPhaseBudget(phaseId);
  const { close } = openModal({
    title: `Definir presupuesto · ${phaseName}`,
    body: `
      <form class="form-grid">
        <label class="field field-full"><span>Presupuesto total (MXN)</span>
          <input type="number" id="ph-budget" min="0" step="0.01" value="${current ?? ""}" placeholder="0.00"></label>
        <p class="hint">Captura el dato real cuando lo tengas confirmado.</p>
      </form>`,
    actions: `
      <button class="btn btn-ghost" data-cancel>Cancelar</button>
      <button class="btn btn-primary" data-save>Guardar</button>`,
  });
  document.querySelector("[data-cancel]").onclick = close;
  document.querySelector("[data-save]").onclick = async () => {
    await store.setPhaseBudget(phaseId, parseFloat(val("ph-budget")) || 0);
    close();
    toast("Presupuesto actualizado.");
    onDone && onDone();
  };
}

function val(id) {
  return document.getElementById(id).value.trim();
}
