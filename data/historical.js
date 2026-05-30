// ============================================================================
//  DATOS HISTÓRICOS INMUTABLES
// ----------------------------------------------------------------------------
//  Todo lo invertido y enviado hasta la fecha del deploy. Estos registros se
//  marcan como `historical: true` y NO pueden editarse ni borrarse en la app.
//
//  Identificadores de fondo:
//    casa_fase0 · casa_fase1 · casa_fase2 · casa_fase3 · casa_acabados
//    gbm · gym · nu · general
// ============================================================================

// --- Definición de fases de la casa -----------------------------------------
export const PHASES = [
  {
    id: "casa_fase0",
    nombre: "Fase 0 — Terreno, puente y barda",
    incluye: "Terreno 2,000 m², puente de acceso y barda perimetral.",
    estado: "completada",
    // ⚠️ PENDIENTE: Paúl confirmará el total real con el excel de su mamá.
    presupuesto: null, // placeholder editable
    placeholder: true,
  },
  {
    id: "casa_fase1",
    nombre: "Fase 1 — Obra negra primera etapa (Diseco César)",
    incluye: "Sala, cocina, comedor, un baño completo, alacena.",
    estado: "completada",
    presupuesto: 463_200, // 433,200 obra + 20,000 extra + 10,000 proyecto
    desglosePresupuesto: [
      { concepto: "Obra cotizada", monto: 433_200 },
      { concepto: "Extra (malla, aislamiento, pintura)", monto: 20_000 },
      { concepto: "Proyecto arquitectónico", monto: 10_000 },
    ],
  },
  {
    id: "casa_fase2",
    nombre: "Fase 2 — Proyecto 2026 (Javier Holguín)",
    incluye: "2 recámaras + baño compartido + barda de celosía.",
    estado: "en_progreso",
    presupuesto: 373_829.11, // 339,844.65 base + 33,984.46 contingencia 10%
    desglosePresupuesto: [
      { concepto: "Presupuesto base", monto: 339_844.65 },
      { concepto: "Contingencia 10%", monto: 33_984.46 },
    ],
  },
  {
    id: "casa_fase3",
    nombre: "Fase 3 — Pendiente",
    incluye:
      "Garaje, cuarto de cine/estudio, recámara principal, baño completo con toilet privado y walking closet.",
    estado: "pendiente",
    presupuesto: null, // por definir (pendiente cotización)
    placeholder: true,
  },
  {
    id: "casa_acabados",
    nombre: "Acabados generales (toda la casa)",
    incluye: "Acabados para dejar la casa en punto habitable.",
    estado: "pendiente",
    presupuesto: 1_000_000, // estimado
  },
];

// --- Movimientos históricos inmutables --------------------------------------
// amountMXN positivo = entrada/aplicado a obra; isDiscount = descuento/devolución.
export const HISTORICAL_MOVEMENTS = [
  // ----- Fase 1 (jul 2024 → mar 2025) -----
  { id: "h-f1-01", date: "2024-07-05", fund: "casa_fase1", concept: "Pago", amountMXN: 50_000, isDiscount: false, notes: "" },
  { id: "h-f1-02", date: "2024-08-14", fund: "casa_fase1", concept: "Pago", amountMXN: 82_000, isDiscount: false, notes: "" },
  { id: "h-f1-03", date: "2024-09-14", fund: "casa_fase1", concept: "Pago", amountMXN: 90_000, isDiscount: false, notes: "" },
  { id: "h-f1-04", date: "2024-10-10", fund: "casa_fase1", concept: "Pago (tarjeta)", amountMXN: 60_000, isDiscount: false, notes: "" },
  { id: "h-f1-05", date: "2024-12-19", fund: "casa_fase1", concept: "Pago", amountMXN: 25_000, isDiscount: false, notes: "" },
  { id: "h-f1-06", date: "2025-02-09", fund: "casa_fase1", concept: "Pago", amountMXN: 50_000, isDiscount: false, notes: "" },
  { id: "h-f1-07", date: "2025-02-23", fund: "casa_fase1", concept: "Pago", amountMXN: 30_000, isDiscount: false, notes: "" },
  { id: "h-f1-08", date: "2025-03-01", fund: "casa_fase1", concept: "Pago", amountMXN: 15_000, isDiscount: false, notes: "" },
  { id: "h-f1-09", date: "2025-03-05", fund: "casa_fase1", concept: "Pago", amountMXN: 20_000, isDiscount: false, notes: "" },
  { id: "h-f1-10", date: "2025-03-14", fund: "casa_fase1", concept: "Pago", amountMXN: 18_000, isDiscount: false, notes: "" },
  { id: "h-f1-11", date: "2025-03-27", fund: "casa_fase1", concept: "Pago", amountMXN: 13_200, isDiscount: false, notes: "" },

  // ----- Fase 2 (mar 2026 → may 2026) -----
  { id: "h-f2-01", date: "2026-03-27", fund: "casa_fase2", concept: "Transferencia", amountMXN: 100_000, isDiscount: false, notes: "" },
  { id: "h-f2-02", date: "2026-04-16", fund: "casa_fase2", concept: "Envío", amountMXN: 16_245, isDiscount: false, notes: "" },
  { id: "h-f2-03", date: "2026-04-28", fund: "casa_fase2", concept: "Transferencia", amountMXN: 100_000, isDiscount: false, notes: "" },
  { id: "h-f2-04", date: "2026-05-01", fund: "casa_fase2", concept: "Anticipo (descuento)", amountMXN: 100_000, isDiscount: true, notes: "Anticipo previo descontado" },
  { id: "h-f2-05", date: "2026-05-10", fund: "casa_fase2", concept: "Regalo (descuento)", amountMXN: 1_600, isDiscount: true, notes: "Regalo descontado" },
  { id: "h-f2-06", date: "2026-05-27", fund: "casa_fase2", concept: "Transferencia", amountMXN: 135_000, isDiscount: false, notes: "" },
];
