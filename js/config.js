// ============================================================================
//  CONFIGURACIÓN — Dashboard Financiero Casa Cuauhtémoc
// ----------------------------------------------------------------------------
//  Este archivo contiene la configuración pública de la aplicación.
//
//  SEGURIDAD: la contraseña NUNCA se guarda en texto plano. Aquí solo vive
//  un hash SHA-256 (con salt). Para cambiar la contraseña abre
//  `generar-hash.html` en el navegador, escribe la nueva contraseña y pega
//  el hash resultante en `auth.passwordHash`.
// ============================================================================

export const CONFIG = {
  app: {
    name: "Casa Cuauhtémoc",
    subtitle: "Control Financiero",
    version: "1.0.0",
  },

  // --- Autenticación -------------------------------------------------------
  // Un solo par de credenciales para ambos usuarios (Paúl y su mamá).
  // Credenciales por defecto:  usuario = paul_casa   contraseña = Cuauhtemoc-2026
  // ⚠️  CAMBIA la contraseña antes del deploy con generar-hash.html
  auth: {
    salt: "cc_casa_cuauhtemoc_v1_8f3a",
    username: "paul_casa",
    passwordHash:
      "7c0fd26b326c72a2f261c50f5408ad75072f8f95a6aedf650a5fbbdd5a4bd6e2",
  },

  // --- Backend Google Sheets (opcional) -----------------------------------
  // Si se deja vacío, la app funciona con almacenamiento local del navegador
  // (localStorage). Cuando Paúl configure el Apps Script, pega aquí la URL
  // del Web App para sincronizar los datos entre Colorado y Cuauhtémoc.
  sheets: {
    webAppUrl: "", // p.ej. "https://script.google.com/macros/s/AKfy.../exec"
  },

  // --- Tipo de cambio ------------------------------------------------------
  fx: {
    apiUrl: "https://api.frankfurter.app/latest?from=USD&to=MXN",
    fallbackRate: 18.5, // respaldo si la API no responde
  },

  // --- Metas (MXN) ---------------------------------------------------------
  metas: {
    gbm: 2_500_000,
    gbmRendimiento: 0.07, // 7% anual
    gbmRetiro: 0.04, // 4% retiro sostenible anual
    gym: 800_000,
    acabados: 1_000_000, // estimado para punto habitable
  },
};
