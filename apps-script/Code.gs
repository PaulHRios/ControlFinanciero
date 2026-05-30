/**
 * ============================================================================
 *  BACKEND — Casa Cuauhtémoc (Google Apps Script Web App)
 * ----------------------------------------------------------------------------
 *  Sincroniza los datos del dashboard entre Paúl (Colorado) y su mamá
 *  (Cuauhtémoc) usando un Google Sheet privado.
 *
 *  SEGURIDAD: cada request debe incluir el hash de credenciales (token). El
 *  script lo compara contra el hash guardado en las Propiedades del Script
 *  (Project Settings → Script properties → AUTH_HASH). Nunca se guarda la
 *  contraseña en claro.
 *
 *  Hojas requeridas (nombres exactos):
 *    "Movimientos" | "Envios" | "Fondos" | "Config"
 * ============================================================================
 */

// El hash esperado se lee de las propiedades del script (AUTH_HASH).
// Debe ser idéntico a auth.passwordHash en js/config.js.
function getExpectedHash_() {
  return PropertiesService.getScriptProperties().getProperty('AUTH_HASH') || '';
}

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents || '{}');

    // --- Autenticación ---
    if (req.token !== getExpectedHash_()) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    switch (req.action) {
      case 'getAll':        return json_(getAll_());
      case 'addMovement':   return json_(addMovement_(req.record));
      case 'addEnvio':      return json_(addEnvio_(req.record));
      case 'setNu':         return json_(setNu_(req.nu));
      case 'setPhaseBudget':return json_(setPhaseBudget_(req.phaseId, req.value));
      default:              return json_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// GET simple para verificar que el Web App está vivo.
function doGet() {
  return json_({ ok: true, service: 'casa-cuauhtemoc', ts: new Date().toISOString() });
}

/* --------------------------- Lectura completa --------------------------- */
function getAll_() {
  return {
    ok: true,
    movements: readSheet_('Movimientos'),
    envios: readSheet_('Envios'),
    nu: readNu_(),
    phaseBudgets: readPhaseBudgets_()
  };
}

/* ------------------------------- Escritura ------------------------------ */
function addMovement_(r) {
  var sh = sheet_('Movimientos');
  ensureHeaders_(sh, ['id','date','fund','concept','amountMXN','isDiscount','notes','historical','createdAt']);
  sh.appendRow([r.id, r.date, r.fund, r.concept, r.amountMXN, r.isDiscount, r.notes, false, r.createdAt]);
  return { ok: true };
}

function addEnvio_(r) {
  var sh = sheet_('Envios');
  ensureHeaders_(sh, ['id','date','usd','rate','mxn','platform','fund','notes','createdAt']);
  sh.appendRow([r.id, r.date, r.usd, r.rate, r.mxn, r.platform, r.fund, r.notes, r.createdAt]);
  return { ok: true };
}

function setNu_(nu) {
  var sh = sheet_('Fondos');
  setConfigValue_(sh, 'nu_balance', nu.balance);
  return { ok: true };
}

function setPhaseBudget_(phaseId, value) {
  var sh = sheet_('Config');
  setConfigValue_(sh, 'budget_' + phaseId, value);
  return { ok: true };
}

/* ------------------------------- Helpers -------------------------------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  return sh;
}

function ensureHeaders_(sh, headers) {
  if (sh.getLastRow() === 0) sh.appendRow(headers);
}

function readSheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  return values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    if (obj.date instanceof Date) obj.date = Utilities.formatDate(obj.date, 'UTC', 'yyyy-MM-dd');
    obj.isDiscount = obj.isDiscount === true || obj.isDiscount === 'TRUE' || obj.isDiscount === 'true';
    obj.historical = obj.historical === true || obj.historical === 'TRUE' || obj.historical === 'true';
    return obj;
  });
}

// "Fondos" y "Config" se almacenan como pares clave/valor (col A = clave, col B = valor).
function setConfigValue_(sh, key, value) {
  var data = sh.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function getConfigValue_(name, key) {
  var sh = ss_().getSheetByName(name);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function readNu_() {
  var balance = getConfigValue_('Fondos', 'nu_balance');
  return { balance: Number(balance) || 0, history: [] };
}

function readPhaseBudgets_() {
  var sh = ss_().getSheetByName('Config');
  var out = {};
  if (!sh) return out;
  var data = sh.getDataRange().getValues();
  data.forEach(function (row) {
    if (String(row[0]).indexOf('budget_') === 0) {
      out[String(row[0]).replace('budget_', '')] = Number(row[1]) || 0;
    }
  });
  return out;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
