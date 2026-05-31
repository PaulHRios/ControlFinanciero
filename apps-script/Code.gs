/**
 * ============================================================================
 *  BACKEND — Casa Cuauhtémoc (Google Apps Script Web App)
 * ----------------------------------------------------------------------------
 *  Sincroniza los datos del dashboard entre Paúl (Colorado) y su mamá
 *  (Cuauhtémoc) usando un Google Sheet privado.
 *
 *  SEGURIDAD: cada request incluye el hash de credenciales (token). El script
 *  lo compara contra el hash guardado en las Propiedades del Script
 *  (Project Settings → Script properties → AUTH_HASH). Nunca se guarda la
 *  contraseña en claro.
 *
 *  Modelo (igual que la app):
 *    Movimientos → kind = transfer | pago | regalo | aporte
 *    Config      → presupuestos editables (budget_<faseId>)
 *
 *  Hojas requeridas (nombres exactos):
 *    "Movimientos" | "Config"
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

    if (req.token !== getExpectedHash_()) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    switch (req.action) {
      case 'getAll':     return json_(getAll_());
      case 'addMove':    return json_(addMove_(req.rec));
      case 'deleteMove': return json_(deleteMove_(req.id));
      case 'setBudget':  return json_(setBudget_(req.faseId, req.value));
      default:           return json_({ ok: false, error: 'unknown_action' });
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
    moves: readMoves_(),
    budgets: readBudgets_()
  };
}

/* ------------------------------- Escritura ------------------------------ */
function addMove_(r) {
  var sh = sheet_('Movimientos');
  ensureHeaders_(sh, ['id', 'date', 'kind', 'fase', 'fund', 'concepto', 'monto', 'notas', 'historical', 'createdAt']);
  sh.appendRow([r.id, r.date, r.kind, r.fase || '', r.fund || '', r.concepto || '', r.monto, r.notas || '', false, r.createdAt || '']);
  return { ok: true };
}

function deleteMove_(id) {
  var sh = ss_().getSheetByName('Movimientos');
  if (!sh) return { ok: true };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sh.deleteRow(i + 1); break; }
  }
  return { ok: true };
}

function setBudget_(faseId, value) {
  setConfigValue_(sheet_('Config'), 'budget_' + faseId, value);
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

function readMoves_() {
  var sh = ss_().getSheetByName('Movimientos');
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  return values.map(function (row) {
    var o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    if (o.date instanceof Date) o.date = Utilities.formatDate(o.date, 'UTC', 'yyyy-MM-dd');
    o.monto = Number(o.monto) || 0;
    o.fase = o.fase || null;
    o.fund = o.fund || null;
    o.historical = false; // los de la hoja siempre son del usuario (borrables)
    return o;
  });
}

// "Config" se almacena como pares clave/valor (col A = clave, col B = valor).
function setConfigValue_(sh, key, value) {
  var data = sh.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function readBudgets_() {
  var sh = ss_().getSheetByName('Config');
  var out = {};
  if (!sh) return out;
  sh.getDataRange().getValues().forEach(function (row) {
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
