// ============================================================================
//  APP — bootstrap, navegación y enrutamiento
// ============================================================================
import { CONFIG } from "./config.js";
import { store } from "./store.js";
import { loadRate } from "./fx.js";
import { isAuthenticated, renderLogin, logout } from "./auth.js";
import { renderView } from "./views.js";
import { icon } from "./icons.js";
import { skeleton } from "./ui.js";
import { openMovementForm } from "./forms.js";

const TABS = [
  { id: "dashboard", label: "Inicio", ic: "dashboard" },
  { id: "casa", label: "Casa", ic: "home" },
  { id: "gbm", label: "GBM", ic: "trending" },
  { id: "gym", label: "Gimnasio", ic: "dumbbell" },
  { id: "nu", label: "Nu & Envíos", ic: "send" },
  { id: "historial", label: "Historial", ic: "list" },
];

let currentTab = "dashboard";

const app = {
  navigate(tab) {
    currentTab = tab;
    location.hash = tab;
    renderActive();
    highlightNav();
  },
  refresh() {
    renderActive();
  },
};

function renderActive() {
  const root = document.getElementById("view-root");
  if (root) renderView(currentTab, root, app);
}

function highlightNav() {
  document.querySelectorAll("[data-tab]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-tab") === currentTab);
  });
}

function renderShell() {
  const root = document.getElementById("app");
  const navItems = (cls) =>
    TABS.map(
      (t) =>
        `<button class="${cls}" data-tab="${t.id}">${icon(t.ic, 20)}<span>${t.label}</span></button>`
    ).join("");

  root.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">${icon("home", 20)}</div>
          <div><div class="brand-name">${CONFIG.app.name}</div>
            <div class="brand-sub">${CONFIG.app.subtitle}</div></div>
        </div>
        <nav class="nav">${navItems("nav-item")}</nav>
        <div class="sidebar-foot">
          ${store.isCloudEnabled() ? `<span class="sync-dot ok"></span> Sincronizado (Sheets)` : `<span class="sync-dot"></span> Local (este dispositivo)`}
          <button class="btn btn-ghost btn-block" id="logout-btn">${icon("logout", 16)} Cerrar sesión</button>
        </div>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Menú">${icon("dashboard", 20)}</button>
          <div class="topbar-title" id="topbar-title">${CONFIG.app.name}</div>
          <button class="btn btn-primary btn-sm" id="fab-add">${icon("plus", 16)}<span class="hide-sm">Movimiento</span></button>
        </header>
        <div id="view-root" class="view-root">${skeleton(4)}</div>
      </main>

      <nav class="tabbar">${navItems("tabbar-item")}</nav>
    </div>
    <div id="toasts" class="toasts"></div>
    <div id="modal-host"></div>`;

  // Navegación
  root.querySelectorAll("[data-tab]").forEach((el) => {
    el.onclick = () => app.navigate(el.getAttribute("data-tab"));
  });
  document.getElementById("logout-btn").onclick = logout;
  document.getElementById("fab-add").onclick = () => openMovementForm(app.refresh);
  document.getElementById("menu-toggle").onclick = () =>
    document.querySelector(".sidebar").classList.toggle("open");
}

async function boot() {
  if (!isAuthenticated()) {
    renderLogin(boot);
    return;
  }

  renderShell();

  // Tab inicial desde el hash
  const hashTab = location.hash.replace("#", "");
  if (TABS.some((t) => t.id === hashTab)) currentTab = hashTab;

  // Carga de datos y tipo de cambio en paralelo
  await Promise.all([store.init(), loadRate()]);

  renderActive();
  highlightNav();

  window.addEventListener("hashchange", () => {
    const t = location.hash.replace("#", "");
    if (TABS.some((x) => x.id === t) && t !== currentTab) {
      currentTab = t;
      renderActive();
      highlightNav();
    }
  });
}

boot();
