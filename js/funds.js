// ============================================================================
//  Catálogo de fondos / destinos
// ============================================================================
export const FUND_LABELS = {
  casa_fase0: "Casa · Fase 0",
  casa_fase1: "Casa · Fase 1",
  casa_fase2: "Casa · Fase 2",
  casa_fase3: "Casa · Fase 3",
  casa_acabados: "Casa · Acabados",
  gbm: "GBM",
  gym: "Gimnasio / Bodega",
  nu: "Cuenta Nu",
  general: "General",
};

export const fundLabel = (id) => FUND_LABELS[id] || id;

export const FUND_OPTIONS = Object.entries(FUND_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CONCEPT_OPTIONS = [
  "Transferencia",
  "Pago a obra",
  "Aportación",
  "Ajuste",
  "Otro",
];

export const PLATFORM_OPTIONS = ["Felix Pago", "TapTap Send", "Otro"];
