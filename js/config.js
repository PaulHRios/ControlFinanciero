// ============================================================================
//  CONFIGURACIÓN — Dashboard Financiero Casa Cuauhtémoc
// ----------------------------------------------------------------------------
//  Este archivo contiene la configuración pública de la aplicación.
//
//  SEGURIDAD: ni el usuario ni la contraseña se guardan en texto plano. Aquí
//  solo vive UN hash SHA-256 (con salt) que combina usuario + contraseña, por
//  lo que ninguno de los dos es legible ni recuperable desde el código.
//  Para cambiar las credenciales abre `generar-hash.html` en el navegador,
//  escribe usuario y contraseña y pega el hash resultante en `auth.passwordHash`.
// ============================================================================

export const CONFIG = {
  app: {
    name: "Casa Cuauhtémoc",
    subtitle: "Control Financiero",
    version: "1.0.0",
  },

  // --- Autenticación -------------------------------------------------------
  // Un solo par de credenciales para ambos usuarios. El hash combina
  // usuario + contraseña: no hay forma de leer ninguno de los dos aquí.
  auth: {
    salt: "2f1b9c4e7a8d6f3b2c1e0a9d",
    passwordHash: "1560be2529a8db45aad953e5065c79050e3e239f26cbf5836b46902c2ece588e",
  },

  // --- Backend Google Sheets (opcional) -----------------------------------
  // Si se deja vacío, la app funciona con almacenamiento local del navegador
  // (localStorage). Cuando configures el Apps Script, pega aquí la URL del
  // Web App para sincronizar los datos entre Colorado y Cuauhtémoc.
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
