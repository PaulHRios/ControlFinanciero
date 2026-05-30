// ============================================================================
//  Utilidades de hashing (SHA-256 vía Web Crypto API)
// ============================================================================

/** Devuelve el hash SHA-256 en hexadecimal de una cadena. */
export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash de credenciales: SHA-256( salt:usuario:contraseña ). */
export async function hashCredential(salt, username, password) {
  return sha256(`${salt}:${username}:${password}`);
}
