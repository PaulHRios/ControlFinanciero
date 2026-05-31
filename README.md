# 🏠 Casa Cuauhtémoc — Control Financiero

Dashboard financiero privado para trackear la inversión en la construcción de
la casa en Cuauhtémoc, Chihuahua, más los fondos de GBM y gimnasio/bodega.

Pensado para dos usuarios: **Paúl** (desde Colorado) y su **mamá** (desde
Cuauhtémoc). Ambos ven los mismos números y pueden registrar movimientos.

App estática (HTML + CSS + JavaScript con módulos ES). Sin build, sin
dependencias externas de JS. Lista para **GitHub Pages**.

---

## 💡 Cómo funciona el dinero (modelo claro)

El dinero sigue un flujo simple, con cuatro tipos de movimiento:

| Tipo | Qué es | Efecto |
|------|--------|--------|
| **Envío** | Paúl manda dinero a la cuenta de mamá | **+** disponible de mamá |
| **Pago a obra** | Mamá paga al constructor (una fase) | **−** disponible · **+** pagado de la fase |
| **Otro gasto** | Mamá usa dinero fuera de la obra | **−** disponible |
| **Aportación** | Paúl aporta a GBM o Gimnasio | **+** saldo del fondo |

Así queda siempre claro **cuánto le queda disponible a mamá** (lo recibido
menos lo que ya pagó/gastó) y **cuánto falta por pagar** en cada fase. Ella
puede registrar un pago y el disponible baja automáticamente.

> Ejemplo real: Paúl envió $351,245 para la Fase 2; mamá pagó $100,000 de
> anticipo y regaló $1,600 → le quedan **$249,645 disponibles** para seguir
> pagando la obra.

---

## ✨ Funciones

- **Login con usuario y contraseña** (nunca en claro: solo un hash SHA-256 con salt).
- **5 pestañas**: Inicio, Casa, GBM, Gimnasio, Historial.
- **Cuenta de mamá**: recibido, pagado, otros gastos y **disponible** en vivo.
- **Por fase**: pagado vs presupuesto y **cuánto falta por pagar**.
- **Registrar y borrar** movimientos nuevos (el historial real es inmutable).
- **Estimador de tiempo**: cuándo se terminan Fase 3 → Gimnasio → GBM, en serie.
- **Tipo de cambio USD/MXN** en vivo (frankfurter.app) con respaldo manual.
- **Proyección GBM** con interés compuesto al 7% y gráfica.
- **Exportar a CSV** del historial completo.
- **Diseño dark mode**, responsivo (tab bar inferior en móvil, sidebar en desktop).
- **Backend opcional con Google Sheets** para compartir datos en tiempo real.

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

1. Crea un Google Sheet con 2 hojas: `Movimientos` y `Config`.
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
  app.js                · bootstrap, navegación y menú de "+"
  auth.js               · login y sesión
  data.js               · fases + historial real inmutable (Fase 1 y 2)
  store.js              · almacenamiento (localStorage + Sheets) y cálculos
  views.js              · render de las 5 pestañas
  forms.js              · formularios (envío, pago, gasto, aporte, presupuesto)
  ui.js                 · iconos, toasts y modales
  fx.js                 · tipo de cambio USD/MXN
  format.js             · formateo de dinero, fechas y duraciones
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
