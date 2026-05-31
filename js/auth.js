// ============================================================================
//  AUTENTICACIÓN
// ----------------------------------------------------------------------------
//  El login combina usuario + contraseña en un hash SHA-256 y lo compara con
//  el hash de config.js. Ni el usuario ni la contraseña se guardan en claro.
//  La sesión vive en sessionStorage → se cierra al cerrar el navegador.
// ============================================================================
import { CONFIG } from "./config.js";
import { icon } from "./ui.js";

const KEY = "cc_token";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const hashCred = (salt, user, pass) => sha256(`${salt}:${user}:${pass}`);

export const estaAutenticado = () => sessionStorage.getItem(KEY) === CONFIG.auth.passwordHash;

export function salir() {
  sessionStorage.removeItem(KEY);
  location.reload();
}

export function renderLogin(onOk) {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="login">
      <form class="login-card" id="lf" autocomplete="off">
        <div class="login-ic">${icon("lock", 24)}</div>
        <h1>${CONFIG.app.name}</h1>
        <p class="sub">${CONFIG.app.subtitle}</p>
        <label class="field"><span>${icon("user", 15)} Usuario</span>
          <input type="text" id="lu" autocapitalize="none" autocomplete="off" required></label>
        <label class="field"><span>${icon("lock", 15)} Contraseña</span>
          <input type="password" id="lp" required></label>
        <button class="btn primary block" type="submit">Entrar</button>
        <p class="login-err" id="le" hidden>Usuario o contraseña incorrectos.</p>
      </form>
      <p class="login-foot">Acceso privado · Paúl & familia</p>
    </div>`;

  const form = document.getElementById("lf");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const hash = await hashCred(CONFIG.auth.salt, document.getElementById("lu").value.trim(), document.getElementById("lp").value);
    if (hash === CONFIG.auth.passwordHash) {
      sessionStorage.setItem(KEY, hash);
      onOk();
    } else {
      document.getElementById("le").hidden = false;
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
    }
  };
}
