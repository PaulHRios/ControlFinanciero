# ☁️ Configuración de Google Sheets como backend

Esta guía conecta el dashboard a un Google Sheet privado para que **Paúl
(Colorado)** y su **mamá (Cuauhtémoc)** vean y editen siempre los mismos
números en tiempo real. Tiempo estimado: **20–30 minutos**, una sola vez.

> Si no haces esto, la app igual funciona: guarda los datos en el navegador
> (localStorage) de cada dispositivo, pero **no se comparten** entre ambos.

---

## 1. Crear el Google Sheet

1. Entra a [sheets.google.com](https://sheets.google.com) con la cuenta de Paúl.
2. Crea una hoja nueva y nómbrala, por ejemplo, **Casa Cuauhtémoc — Datos**.
3. Crea **4 hojas** (pestañas inferiores) con estos nombres **exactos**:

   - `Movimientos`
   - `Envios`
   - `Fondos`
   - `Config`

   No es necesario poner encabezados: el script los crea solo.

> Deja el Sheet **privado** (no lo compartas con nadie). La seguridad la da la
> URL del Web App + el hash de contraseña.

---

## 2. Pegar el código Apps Script

1. En el Sheet: menú **Extensiones → Apps Script**.
2. Borra el contenido de `Código.gs` y pega todo el contenido de
   [`Code.gs`](Code.gs).
3. Guarda (💾).

---

## 3. Guardar el hash de la contraseña (clave de seguridad)

1. En el editor de Apps Script, ve a **⚙️ Configuración del proyecto**
   (*Project Settings*).
2. Baja hasta **Propiedades del script** (*Script properties*) →
   **Agregar propiedad**.
3. Propiedad: `AUTH_HASH`
   Valor: el **mismo hash** que tienes en `js/config.js` → `auth.passwordHash`.

   > Por defecto (usuario `paul_casa`, contraseña `Cuauhtemoc-2026`):
   > `7c0fd26b326c72a2f261c50f5408ad75072f8f95a6aedf650a5fbbdd5a4bd6e2`
   >
   > Si cambiaste la contraseña con `generar-hash.html`, usa el hash nuevo
   > tanto aquí como en `config.js`.
4. Guarda.

---

## 4. Publicar como Web App

1. Arriba a la derecha: **Implementar → Nueva implementación**
   (*Deploy → New deployment*).
2. Tipo: selecciona **Aplicación web** (*Web app*).
3. Configura:
   - **Descripción**: `Casa Cuauhtémoc API`
   - **Ejecutar como** (*Execute as*): **Yo / Mi cuenta**.
   - **Quién tiene acceso** (*Who has access*): **Cualquier persona**
     (*Anyone*).
4. Clic en **Implementar**. Autoriza los permisos cuando lo pida
   (es tu propia cuenta).
5. **Copia la URL del Web App** — termina en `/exec`.

> Cada vez que cambies el código, usa **Implementar → Gestionar
> implementaciones → ✏️ editar → Nueva versión** para que aplique.

---

## 5. Conectar el dashboard

1. Abre `js/config.js`.
2. Pega la URL en:

   ```js
   sheets: {
     webAppUrl: "https://script.google.com/macros/s/AKfy.../exec",
   },
   ```
3. Guarda, haz commit y push. El deploy de GitHub Pages se actualiza solo.

Cuando esté conectado, el dashboard mostrará **“Sincronizado (Sheets)”** en la
barra lateral y todos los registros nuevos se guardarán en el Google Sheet.

---

## ✅ Verificar

- Abre la URL del Web App en el navegador: debe responder algo como
  `{"ok":true,"service":"casa-cuauhtemoc",...}`.
- En el dashboard, registra un movimiento de prueba y revisa que aparezca una
  fila nueva en la hoja `Movimientos`.

---

## 🔒 Notas de seguridad

- El Sheet permanece **privado**.
- La **URL del Web App** actúa como token (larga y única) — no la publiques.
- El Apps Script **rechaza** cualquier request cuyo hash no coincida con
  `AUTH_HASH` (doble capa: login en el frontend + validación en el backend).
- La contraseña **nunca** viaja ni se guarda en texto plano.
