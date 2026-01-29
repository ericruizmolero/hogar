import type { Property } from '../types';
import type { Requirements } from '../hooks/useRequirements';

// Default requirements (used when not loaded from Firebase)
export const DEFAULT_REQUIREMENTS: Requirements = {
  minUsableM2: 80,
  minBuiltM2: 90,
  minBathrooms: 2,
  minRooms: 2,
  maxPrice: 700000,
  maxPriceRenovation: 650000,
  minFloor: 3,
  requireElevator: false,
  preferredZones: ['antiguo', 'centro', 'gros', 'amara', 'parte vieja', 'egia'],
  preferredOrientations: ['sur', 'sureste', 'suroeste'],
  minYear: 1960,
};

// Current requirements (can be updated at runtime)
let currentRequirements: Requirements = DEFAULT_REQUIREMENTS;

export function setRequirements(req: Requirements) {
  currentRequirements = req;
}

export function getRequirements(): Requirements {
  return currentRequirements;
}

export interface RequirementResult {
  key: string;
  label: string;
  met: boolean;
  critical: boolean;
  value?: string;
  expected?: string;
}

export interface PropertyScore {
  score: number;
  results: RequirementResult[];
  passesMinimum: boolean;
}

/**
 * Extrae el número de planta de un string como "Planta 3", "3ª", "Bajo", etc.
 */
function parseFloor(floor: string): number | null {
  if (!floor) return null;
  const lower = floor.toLowerCase();

  if (lower.includes('bajo') || lower.includes('entreplanta')) return 0;
  if (lower.includes('ático')) return 10;
  if (lower.includes('sótano') || lower.includes('semisótano')) return -1;

  const match = floor.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return null;
}

/**
 * Comprueba si la zona está en las preferidas
 */
function isPreferredZone(zone: string, address: string, preferredZones: string[]): boolean {
  const text = `${zone} ${address}`.toLowerCase();
  return preferredZones.some(z => text.includes(z.toLowerCase()));
}

/**
 * Comprueba si la orientación es preferida
 */
function isPreferredOrientation(orientation: string, preferredOrientations: string[]): boolean {
  if (!orientation) return false;
  const lower = orientation.toLowerCase();
  return preferredOrientations.some(o => lower.includes(o.toLowerCase()));
}

/**
 * Evalúa una propiedad contra los requisitos
 */
export function evaluateProperty(property: Property, req: Requirements = currentRequirements): PropertyScore {
  const results: RequirementResult[] = [];

  // 1. Metros útiles
  const usableM2 = property.usableSquareMeters || 0;
  results.push({
    key: 'usableM2',
    label: `M² útiles ≥ ${req.minUsableM2}`,
    met: usableM2 >= req.minUsableM2 || usableM2 === 0, // N/D no penaliza
    critical: true,
    value: usableM2 > 0 ? `${usableM2} m²` : 'N/D',
    expected: `≥ ${req.minUsableM2} m²`,
  });

  // 2. Metros construidos
  const builtM2 = property.builtSquareMeters || property.squareMeters || 0;
  results.push({
    key: 'builtM2',
    label: `M² construidos ≥ ${req.minBuiltM2}`,
    met: builtM2 >= req.minBuiltM2,
    critical: true,
    value: builtM2 > 0 ? `${builtM2} m²` : 'N/D',
    expected: `≥ ${req.minBuiltM2} m²`,
  });

  // 3. Baños
  results.push({
    key: 'bathrooms',
    label: `Baños ≥ ${req.minBathrooms}`,
    met: property.bathrooms >= req.minBathrooms,
    critical: true,
    value: `${property.bathrooms}`,
    expected: `≥ ${req.minBathrooms}`,
  });

  // 4. Habitaciones
  results.push({
    key: 'rooms',
    label: `Habitaciones ≥ ${req.minRooms}`,
    met: property.rooms >= req.minRooms,
    critical: true,
    value: `${property.rooms}`,
    expected: `≥ ${req.minRooms}`,
  });

  // 5. Precio
  const isRenovation = property.needsRenovation === 'partial' || property.needsRenovation === 'total';
  const maxPrice = isRenovation ? req.maxPriceRenovation : req.maxPrice;
  const priceLabel = isRenovation
    ? `Precio ≤ ${(req.maxPriceRenovation / 1000).toFixed(0)}K (reforma)`
    : `Precio ≤ ${(req.maxPrice / 1000).toFixed(0)}K`;
  results.push({
    key: 'price',
    label: priceLabel,
    met: property.price <= maxPrice,
    critical: true,
    value: `${(property.price / 1000).toFixed(0)}K`,
    expected: `≤ ${(maxPrice / 1000).toFixed(0)}K`,
  });

  // 6. Planta
  const floorNum = parseFloor(property.floor);
  results.push({
    key: 'floor',
    label: `Planta ≥ ${req.minFloor}ª`,
    met: floorNum !== null && floorNum >= req.minFloor,
    critical: false,
    value: property.floor || 'N/D',
    expected: `≥ ${req.minFloor}ª`,
  });

  // 7. Ascensor
  results.push({
    key: 'elevator',
    label: 'Ascensor',
    met: req.requireElevator ? property.elevator === true : true,
    critical: req.requireElevator,
    value: property.elevator ? 'Sí' : 'No',
    expected: req.requireElevator ? 'Sí' : 'Preferible',
  });

  // 8. Zona preferida
  const zonesLabel = req.preferredZones.slice(0, 3).join(', ') + (req.preferredZones.length > 3 ? '...' : '');
  results.push({
    key: 'zone',
    label: 'Zona preferida',
    met: isPreferredZone(property.zone, property.address, req.preferredZones),
    critical: false,
    value: property.zone || 'N/D',
    expected: zonesLabel,
  });

  // 9. Orientación
  results.push({
    key: 'orientation',
    label: 'Orientación preferida',
    met: isPreferredOrientation(property.orientation, req.preferredOrientations),
    critical: false,
    value: property.orientation || 'N/D',
    expected: req.preferredOrientations.join(', '),
  });

  // 10. Año construcción
  const yearOk = property.yearBuilt === 0 || property.yearBuilt >= req.minYear;
  results.push({
    key: 'year',
    label: `Construcción ≥ ${req.minYear}`,
    met: yearOk,
    critical: false,
    value: property.yearBuilt > 0 ? `${property.yearBuilt}` : 'N/D',
    expected: `≥ ${req.minYear}`,
  });

  // Calcular puntuación
  const criticalResults = results.filter(r => r.critical);
  const nonCriticalResults = results.filter(r => !r.critical);

  const criticalMet = criticalResults.filter(r => r.met).length;
  const nonCriticalMet = nonCriticalResults.filter(r => r.met).length;

  const criticalScore = criticalResults.length > 0 ? (criticalMet / criticalResults.length) * 60 : 60;
  const nonCriticalScore = nonCriticalResults.length > 0 ? (nonCriticalMet / nonCriticalResults.length) * 40 : 40;
  const score = Math.round(criticalScore + nonCriticalScore);

  const passesMinimum = criticalResults.every(r => r.met);

  return {
    score,
    results,
    passesMinimum,
  };
}

/**
 * Devuelve el color según la puntuación
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-visited-text)';
  if (score >= 60) return 'var(--color-favorite-text)';
  if (score >= 40) return 'var(--color-contacted-text)';
  return 'var(--color-discarded-text)';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'var(--color-visited)';
  if (score >= 60) return 'var(--color-favorite)';
  if (score >= 40) return 'var(--color-contacted)';
  return 'var(--color-discarded)';
}
