// ============================================================================
//  AUTENTICACIÓN
// ----------------------------------------------------------------------------
//  Doble capa:
//   1) Frontend: combina usuario + contraseña en un hash SHA-256 y lo compara
//      con el hash guardado en config.js. Ni el usuario ni la contraseña se
//      guardan en claro ni son recuperables desde el código.
//   2) Backend (Apps Script): valida el mismo hash en cada request.
//
//  La sesión vive en sessionStorage → expira al cerrar el navegador.
// ============================================================================
import { CONFIG } from "./config.js";
import { hashCredential } from "./crypto.js";
import { icon } from "./icons.js";

const SESSION_KEY = "cc_auth_token";

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === CONFIG.auth.passwordHash;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

/** Renderiza la pantalla de login y resuelve cuando el acceso es válido. */
export function renderLogin(onSuccess) {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="login-screen">
      <form class="login-card" id="login-form" autocomplete="off">
        <div class="login-badge">${icon("lock", 26)}</div>
        <h1>${CONFIG.app.name}</h1>
        <p class="login-sub">${CONFIG.app.subtitle}</p>
        <label class="field">
          <span>${icon("user", 16)} Usuario</span>
          <input type="text" id="login-user" autocapitalize="none" autocomplete="off" required />
        </label>
        <label class="field">
          <span>${icon("lock", 16)} Contraseña</span>
          <input type="password" id="login-pass" placeholder="••••••••" required />
        </label>
        <button type="submit" class="btn btn-primary btn-block">Entrar</button>
        <p class="login-error" id="login-error" hidden>Usuario o contraseña incorrectos.</p>
      </form>
      <p class="login-foot">Acceso privado · Paúl & familia</p>
    </div>`;

  const form = document.getElementById("login-form");
  const errEl = document.getElementById("login-error");
  form.onsubmit = async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const user = document.getElementById("login-user").value.trim();
    const pass = document.getElementById("login-pass").value;
    // El usuario va dentro del hash: una credencial incorrecta produce un hash
    // distinto y se rechaza. No se compara el usuario en claro.
    const hash = await hashCredential(CONFIG.auth.salt, user, pass);

    if (hash === CONFIG.auth.passwordHash) {
      sessionStorage.setItem(SESSION_KEY, hash);
      onSuccess();
    } else {
      errEl.hidden = false;
      form.classList.remove("shake");
      void form.offsetWidth; // reinicia la animación
      form.classList.add("shake");
    }
  };
}
