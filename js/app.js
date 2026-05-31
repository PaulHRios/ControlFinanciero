// ============================================================================
//  APP — bootstrap, navegación y menú de "+"
// ============================================================================
import { CONFIG } from "./config.js";
import { initStore, isCloud, storageWorks } from "./store.js";
import { loadRate } from "./fx.js";
import { estaAutenticado, renderLogin, salir } from "./auth.js";
import { render } from "./views.js";
import { icon, modal } from "./ui.js";
import { formEnvio, formPago, formRegalo, formAporte } from "./forms.js";

const TABS = [
  { id: "inicio", label: "Inicio", ic: "home" },
  { id: "casa", label: "Casa", ic: "home" },
  { id: "gbm", label: "GBM", ic: "trending" },
  { id: "gym", label: "Gimnasio", ic: "dumbbell" },
  { id: "historial", label: "Historial", ic: "list" },
];

let tab = "inicio";

const app = {
  go(t) {
    tab = t;
    location.hash = t;
    paint();
    marca();
  },
  refresh() {
    paint();
  },
};

function paint() {
  const root = document.getElementById("view-root");
  if (root) render(tab, root, app);
}

function marca() {
  document.querySelectorAll("[data-tab]").forEach((el) =>
    el.classList.toggle("active", el.dataset.tab === tab)
  );
}

// Menú del botón "+": elige qué registrar
function menuAgregar() {
  const m = modal({
    title: "¿Qué quieres registrar?",
    body: `<div class="menu-add">
      <button class="add-opt" data-o="envio"><span class="add-ic in">${icon("arrowUp", 18)}</span>
        <span><b>Envío a mamá</b><small>Mandas dinero a su cuenta</small></span></button>
      <button class="add-opt" data-o="pago"><span class="add-ic out">${icon("arrowDown", 18)}</span>
        <span><b>Pago a la obra</b><small>Mamá paga al constructor</small></span></button>
      <button class="add-opt" data-o="regalo"><span class="add-ic out">${icon("gift", 18)}</span>
        <span><b>Otro gasto</b><small>Dinero usado fuera de la obra</small></span></button>
      <button class="add-opt" data-o="gbm"><span class="add-ic in">${icon("trending", 18)}</span>
        <span><b>Aportar a GBM</b><small>Fondo de inversión</small></span></button>
      <button class="add-opt" data-o="gym"><span class="add-ic in">${icon("dumbbell", 18)}</span>
        <span><b>Aportar a Gimnasio</b><small>Fondo del gym/bodega</small></span></button>
    </div>`,
  });
  const open = (fn, ...a) => {
    m.close();
    setTimeout(() => fn(app.refresh, ...a), 210);
  };
  m.el.querySelectorAll("[data-o]").forEach((b) => {
    b.onclick = () => {
      const o = b.dataset.o;
      if (o === "envio") open(formEnvio);
      else if (o === "pago") open(formPago);
      else if (o === "regalo") open(formRegalo);
      else if (o === "gbm") open(formAporte, "gbm");
      else if (o === "gym") open(formAporte, "gym");
    };
  });
}

function shell() {
  const root = document.getElementById("app");
  const items = (cls) =>
    TABS.map((t) => `<button class="${cls}" data-tab="${t.id}">${icon(t.ic, 20)}<span>${t.label}</span></button>`).join("");
  const sync = isCloud()
    ? `<span class="dot ok"></span> Sincronizado (Sheets)`
    : storageWorks()
    ? `<span class="dot ok"></span> Guardado en este dispositivo`
    : `<span class="dot warn"></span> Sin almacenamiento disponible`;

  root.innerHTML = `
    <div class="layout">
      <aside class="side">
        <div class="brand"><div class="brand-ic">${icon("home", 18)}</div>
          <div><div class="brand-name">${CONFIG.app.name}</div><div class="brand-sub">${CONFIG.app.subtitle}</div></div></div>
        <nav class="nav">${items("nav-item")}</nav>
        <div class="side-foot"><div class="sync">${sync}</div>
          <button class="btn ghost block" id="logout">${icon("logout", 16)} Cerrar sesión</button></div>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="ghost-icon menu-tg" id="menu-tg">${icon("list", 20)}</button>
          <span class="topbar-title">${CONFIG.app.name}</span>
          <button class="btn primary sm" id="add">${icon("plus", 16)}<span class="hide-xs">Agregar</span></button>
        </header>
        <div id="view-root" class="view-root"></div>
      </main>

      <nav class="tabbar">${items("tab-item")}</nav>
    </div>
    <div id="toasts" class="toasts"></div>
    <div id="modal-host"></div>`;

  root.querySelectorAll("[data-tab]").forEach((el) => (el.onclick = () => app.go(el.dataset.tab)));
  document.getElementById("logout").onclick = salir;
  document.getElementById("add").onclick = menuAgregar;
  document.getElementById("menu-tg").onclick = () => document.querySelector(".side").classList.toggle("open");
}

async function boot() {
  if (!estaAutenticado()) return renderLogin(boot);
  shell();
  const h = location.hash.replace("#", "");
  if (TABS.some((t) => t.id === h)) tab = h;
  await Promise.all([initStore(), loadRate()]);
  paint();
  marca();
  window.addEventListener("hashchange", () => {
    const t = location.hash.replace("#", "");
    if (TABS.some((x) => x.id === t) && t !== tab) {
      tab = t;
      paint();
      marca();
    }
  });
}

boot();
