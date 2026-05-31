# 🏠 Casa Cuauhtémoc — Control Financiero

Dashboard financiero privado para trackear la inversión en la construcción de
la casa en Cuauhtémoc, Chihuahua, más los fondos de GBM, gimnasio/bodega y la
cuenta Nu (buffer de envíos USD → MXN).

Pensado para dos usuarios: **Paúl** (desde Colorado) y su **mamá** (desde
Cuauhtémoc). Ambos ven los mismos números y pueden registrar pagos y envíos.

App estática (HTML + CSS + JavaScript con módulos ES). Sin build, sin
dependencias externas de JS. Lista para **GitHub Pages**.

---

## ✨ Funciones

- **Login con usuario y contraseña** (la contraseña nunca se guarda en claro:
  solo un hash SHA-256 con salt).
- **6 pestañas**: Dashboard, Casa, GBM, Gimnasio, Nu & Envíos, Historial.
- **Estimador de tiempo**: calcula cuándo se terminan Fase 3 → Gimnasio → GBM,
  en serie, según el promedio mensual de envíos. Se recalcula con cada registro.
- **Datos históricos inmutables** de Fase 1 y Fase 2 (no editables).
- **Tipo de cambio USD/MXN** en vivo (frankfurter.app) con respaldo manual.
- **Proyección GBM** con interés compuesto al 7% y gráfica SVG.
- **Exportar a CSV** del historial completo.
- **Diseño dark mode**, responsivo (tab bar inferior en móvil, sidebar en
  desktop), con skeleton loaders, toasts y micro-interacciones.
- **Backend opcional con Google Sheets** para que los datos se compartan en
  tiempo real entre Colorado y Cuauhtémoc.

> Sin Google Sheets configurado, la app funciona perfecto guardando los datos
> en el navegador (localStorage) de cada dispositivo.

---

## 🔐 Credenciales

El usuario y la contraseña **no aparecen en ningún archivo del repositorio**.
En el código solo vive un hash SHA-256 (con salt) que combina usuario +
contraseña; de ahí no se pueden leer ni recuperar. Guarda tus credenciales
por tu cuenta (fuera del repo).

Para cambiarlas, abre `generar-hash.html`, escribe el usuario y la contraseña
nuevos, copia el hash y pégalo en `js/config.js` → `auth.passwordHash`.

---

## 🚀 Deploy en GitHub Pages

Ya viene un workflow (`.github/workflows/deploy-pages.yml`) que publica
automáticamente. Solo falta habilitar Pages una vez:

1. En GitHub: **Settings → Pages**.
2. En **Source**, elige **GitHub Actions**.
3. Cada push a la rama dispara el deploy. La URL aparece en la pestaña
   **Actions → Deploy to GitHub Pages**.

**Alternativa (deploy desde rama, sin Actions):**
Settings → Pages → Source: *Deploy from a branch* → rama
`claude/casa-cuauhtemoc-dashboard-5pb2T`, carpeta `/ (root)`.

---

## ☁️ Conectar Google Sheets (opcional, ~20–30 min)

Para que Paúl y su mamá compartan los mismos datos, sigue
[`apps-script/SETUP.md`](apps-script/SETUP.md). Resumen:

1. Crea un Google Sheet con 4 hojas: `Movimientos`, `Envios`, `Fondos`, `Config`.
2. Extensiones → Apps Script → pega `apps-script/Code.gs`.
3. En *Project Settings → Script properties* agrega `AUTH_HASH` con el mismo
   hash que `js/config.js`.
4. Deploy como **Web App** (Ejecutar como: tú · Acceso: cualquier persona).
5. Copia la URL y pégala en `js/config.js` → `sheets.webAppUrl`.

---

## 🗂️ Estructura

```
index.html              · app principal
generar-hash.html       · utilidad para generar el hash de la contraseña
css/styles.css          · estilos (dark mode, responsivo)
js/
  config.js             · configuración (credenciales hash, metas, URLs)
  app.js                · bootstrap + navegación
  auth.js               · login y sesión
  crypto.js             · hashing SHA-256
  store.js              · capa de datos (localStorage + Sheets)
  compute.js            · cálculos financieros y estimador
  views.js              · render de las 6 pestañas
  forms.js              · formularios (movimiento, envío, Nu, presupuesto)
  charts.js             · gráficas SVG
  fx.js                 · tipo de cambio USD/MXN
  funds.js · format.js · icons.js · ui.js   · utilidades
data/historical.js      · datos históricos inmutables (Fase 1 y 2)
apps-script/Code.gs     · backend Google Apps Script
apps-script/SETUP.md    · guía paso a paso de Google Sheets
```

---

## 📌 Pendiente de datos

- **Fase 0** (terreno, puente, barda): el total real queda como *placeholder*
  editable hasta que se confirme el dato. Edítalo desde la pestaña **Casa**.
- **Fase 3**: presupuesto por definir (también editable desde **Casa**).

Los datos de **Fase 1** y **Fase 2** ya están cargados como históricos
inmutables.
