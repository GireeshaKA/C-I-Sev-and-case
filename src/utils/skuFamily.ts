/**
 * Microinverter Type — normalized generation classifier.
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for IQ8/IQ9 classification.
 * Do not duplicate this logic in React components or other services.
 * Import classifyMicroinverterType() wherever type classification is needed.
 *
 * Business rule (verified against Incorta C&I fleet data 2026-09-28):
 *   SKU starts with "IQ8" → IQ8  (e.g. IQ8P-3P-72-E-US, IQ8H-3P-72-E-US)
 *   SKU starts with "IQ9" → IQ9  (e.g. IQ9N-3P-277-A-DOM-US)
 *   SKU is empty/null    → UNKNOWN (cannot classify without source data)
 *   SKU other prefix     → OTHER   (not IQ8/IQ9; do not silently assume)
 *
 * Source field: mi_product_sku (col 10), Incorta C&I Severity & Cases Business View.
 * If Enphase adds a first-class type field to the Business View, replace this
 * derivation with the authoritative field and update this file only.
 */
export type MicroinverterType = 'IQ8' | 'IQ9' | 'OTHER' | 'UNKNOWN';

export const MICROINVERTER_TYPE_LABELS: Record<MicroinverterType, string> = {
  IQ8:     'IQ8',
  IQ9:     'IQ9',
  OTHER:   'Other',
  UNKNOWN: 'Unknown',
};

export const MICROINVERTER_TYPE_COLORS: Record<MicroinverterType, string> = {
  IQ8:     '#2563EB',   // Blue
  IQ9:     '#7C3AED',   // Violet
  OTHER:   '#64748B',   // Slate
  UNKNOWN: '#94A3B8',   // Light slate
};

export function classifyMicroinverterType(sku: string | null | undefined): MicroinverterType {
  if (!sku || !sku.trim()) return 'UNKNOWN';
  const upper = sku.toUpperCase().trim();
  if (upper.startsWith('IQ8')) return 'IQ8';
  if (upper.startsWith('IQ9')) return 'IQ9';
  return 'OTHER';
}

/** @deprecated Use classifyMicroinverterType() instead */
export type SkuFamily = 'IQ8' | 'IQ9' | 'Unknown';

/** @deprecated Use classifyMicroinverterType() instead */
export function getSkuFamily(sku: string): SkuFamily {
  const t = classifyMicroinverterType(sku);
  if (t === 'IQ8') return 'IQ8';
  if (t === 'IQ9') return 'IQ9';
  return 'Unknown';
}
