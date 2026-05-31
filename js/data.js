// ============================================================================
//  DATOS BASE — Casa Cuauhtémoc
// ----------------------------------------------------------------------------
//  Modelo simple y claro de 3 tipos de movimiento:
//
//   • transfer  → Paúl ENVÍA dinero a la cuenta de mamá.   (+ disponible)
//   • pago      → Mamá PAGA a la obra (una fase).          (− disponible, + pagado fase)
//   • regalo    → Mamá usa dinero en otra cosa.            (− disponible)
//   • aporte    → Paúl aporta a un fondo (GBM / Gimnasio).  (saldo del fondo)
//
//  Cuenta de mamá (disponible)  =  Σ transfer − Σ pago − Σ regalo
//  Pagado de una fase           =  Σ pago de esa fase
//
//  Los registros `historical: true` son el historial real y no se editan.
// ============================================================================

// --- Fases de la casa --------------------------------------------------------
export const PHASES = [
  {
    id: "casa_fase0",
    nombre: "Fase 0 · Terreno, puente y barda",
    incluye: "Terreno 2,000 m², puente de acceso y barda perimetral.",
    estado: "completada",
    presupuesto: null, // PENDIENTE: confirmar con el excel
  },
  {
    id: "casa_fase1",
    nombre: "Fase 1 · Obra negra (Diseco César)",
    incluye: "Sala, cocina, comedor, un baño completo y alacena.",
    estado: "completada",
    presupuesto: 463_200,
  },
  {
    id: "casa_fase2",
    nombre: "Fase 2 · Proyecto 2026 (Javier Holguín)",
    incluye: "2 recámaras, baño compartido y barda de celosía.",
    estado: "en_progreso",
    presupuesto: 373_829.11,
  },
  {
    id: "casa_fase3",
    nombre: "Fase 3 · Pendiente",
    incluye:
      "Garaje, cuarto de cine/estudio, recámara principal, baño con toilet privado y walking closet.",
    estado: "pendiente",
    presupuesto: null, // por cotizar
  },
  {
    id: "casa_acabados",
    nombre: "Acabados generales",
    incluye: "Acabados para dejar la casa en punto habitable.",
    estado: "pendiente",
    presupuesto: 1_000_000,
  },
];

export const PHASE_IDS = PHASES.map((p) => p.id);

// Etiquetas legibles para fondos/fases.
export const LABELS = {
  casa_fase0: "Fase 0",
  casa_fase1: "Fase 1",
  casa_fase2: "Fase 2",
  casa_fase3: "Fase 3",
  casa_acabados: "Acabados",
  gbm: "GBM",
  gym: "Gimnasio",
};
export const label = (id) => LABELS[id] || id;

export const PLATAFORMAS = ["Felix Pago", "TapTap Send", "Otro"];

// --- Historial real (inmutable) ---------------------------------------------
//  Fase 1: se fondeó y se pagó por completo (queda en $0 disponible).
//  Fase 2: Paúl envió $351,245; mamá pagó $100,000 de anticipo y regaló $1,600
//          → le quedan $249,645 disponibles en su cuenta.
export const SEED_MOVES = [
  // ----- Fase 1: fondeo + pagos (se cancelan entre sí en el disponible) -----
  { id: "s-f1-fond", date: "2024-07-05", kind: "transfer", concepto: "Fondeo Fase 1 (acumulado)", monto: 453_200 },
  { id: "s-f1-01", date: "2024-07-05", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 50_000 },
  { id: "s-f1-02", date: "2024-08-14", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 82_000 },
  { id: "s-f1-03", date: "2024-09-14", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 90_000 },
  { id: "s-f1-04", date: "2024-10-10", kind: "pago", fase: "casa_fase1", concepto: "Pago (tarjeta)", monto: 60_000 },
  { id: "s-f1-05", date: "2024-12-19", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 25_000 },
  { id: "s-f1-06", date: "2025-02-09", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 50_000 },
  { id: "s-f1-07", date: "2025-02-23", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 30_000 },
  { id: "s-f1-08", date: "2025-03-01", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 15_000 },
  { id: "s-f1-09", date: "2025-03-05", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 20_000 },
  { id: "s-f1-10", date: "2025-03-14", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 18_000 },
  { id: "s-f1-11", date: "2025-03-27", kind: "pago", fase: "casa_fase1", concepto: "Pago", monto: 13_200 },

  // ----- Fase 2: envíos de Paúl + anticipo + regalo -----
  { id: "s-f2-01", date: "2026-03-27", kind: "transfer", concepto: "Transferencia", monto: 100_000 },
  { id: "s-f2-02", date: "2026-04-16", kind: "transfer", concepto: "Envío", monto: 16_245 },
  { id: "s-f2-03", date: "2026-04-28", kind: "transfer", concepto: "Transferencia", monto: 100_000 },
  { id: "s-f2-04", date: "2026-05-01", kind: "pago", fase: "casa_fase2", concepto: "Anticipo al constructor", monto: 100_000 },
  { id: "s-f2-05", date: "2026-05-10", kind: "regalo", concepto: "Regalo", monto: 1_600 },
  { id: "s-f2-06", date: "2026-05-27", kind: "transfer", concepto: "Transferencia", monto: 135_000 },
].map((m) => ({ historical: true, ...m }));
