// ============================================================================
//  Componentes de interfaz: toasts, modales, confirmaciones
// ============================================================================
import { icon } from "./icons.js";

// --- Toast -------------------------------------------------------------------
export function toast(message, type = "success") {
  const host = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icon(type === "success" ? "check" : "alert", 18)}<span>${message}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

// --- Modal genérico ----------------------------------------------------------
export function openModal({ title, body, actions }) {
  const host = document.getElementById("modal-host");
  host.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-head">
          <h3>${title}</h3>
          <button class="icon-btn" data-close aria-label="Cerrar">${icon("x", 18)}</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-foot">${actions || ""}</div>
      </div>
    </div>`;
  const backdrop = host.querySelector(".modal-backdrop");
  requestAnimationFrame(() => backdrop.classList.add("show"));

  const close = () => {
    backdrop.classList.remove("show");
    setTimeout(() => (host.innerHTML = ""), 200);
  };
  host.querySelectorAll("[data-close]").forEach((b) => (b.onclick = close));
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };
  return { host, close };
}

/** Confirmación con advertencia de inmutabilidad. */
export function confirmDialog({ title, message, confirmLabel = "Confirmar", danger = false }) {
  return new Promise((resolve) => {
    const { close } = openModal({
      title,
      body: `<p class="confirm-msg">${message}</p>`,
      actions: `
        <button class="btn btn-ghost" data-cancel>Cancelar</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-ok>${confirmLabel}</button>`,
    });
    document.querySelector("[data-cancel]").onclick = () => {
      close();
      resolve(false);
    };
    document.querySelector("[data-ok]").onclick = () => {
      close();
      resolve(true);
    };
  });
}

export function emptyState(message, sub = "") {
  return `<div class="empty">
    <div class="empty-icon">${icon("list", 28)}</div>
    <p class="empty-title">${message}</p>
    ${sub ? `<p class="empty-sub">${sub}</p>` : ""}
  </div>`;
}

export function skeleton(rows = 3) {
  return `<div class="skeleton-group">${Array.from({ length: rows })
    .map(() => `<div class="skeleton-row"></div>`)
    .join("")}</div>`;
}
