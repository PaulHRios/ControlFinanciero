// ============================================================================
//  CONFIGURACIÓN — Dashboard Financiero Casa Cuauhtémoc
// ----------------------------------------------------------------------------
//  Configuración pública de la aplicación.
//
//  SEGURIDAD: ni el usuario ni la contraseña se guardan en texto plano. Aquí
//  solo vive UN hash SHA-256 (con salt) que combina usuario + contraseña, por
//  lo que ninguno de los dos es legible ni recuperable desde el código.
//  Para cambiar las credenciales abre `generar-hash.html`, escribe usuario y
//  contraseña y pega el hash resultante en auth.passwordHash.
// ============================================================================

export const CONFIG = {
  app: { name: "Casa Cuauhtémoc", subtitle: "Control Financiero", version: "1.0.0" },

  // El hash combina usuario + contraseña: no hay forma de leer ninguno aquí.
  auth: {
    salt: "7686eb3d54900309493fc8760266e3d9",
    passwordHash: "bb8845c03eab6add9227f52ffda724c0be045bb5efbd0eaab9c8906361a965cc",
  },

  // Backend opcional: si se deja vacío, la app usa localStorage del navegador.
  sheets: { webAppUrl: "" },

  fx: {
    apiUrl: "https://api.frankfurter.app/latest?from=USD&to=MXN",
    fallbackRate: 18.5,
  },

  metas: {
    gbm: 2_500_000,
    gbmRendimiento: 0.07,
    gbmRetiro: 0.04,
    gym: 800_000,
    acabados: 1_000_000,
  },
};
