/**
 * Servicio para interactuar con la API de Idealista a través del backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface SearchParams {
  locationId?: string;
  locationName?: string;
  operation?: 'sale' | 'rent';
  order?: 'relevance' | 'price' | 'date' | 'size';
  numPage?: number;
  maxItems?: number;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
}

export interface IdealistaProperty {
  id: string;
  title: string;
  price: number;
  squareMeters: number;
  pricePerMeter: number;
  rooms: number;
  bathrooms: number;
  address: string;
  district: string;
  municipality: string;
  province: string;
  floor: string;
  exterior: boolean;
  elevator: boolean;
  parking: boolean;
  url: string;
  thumbnail: string;
  description: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
}

export interface SearchResponse {
  success: boolean;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  properties?: IdealistaProperty[];
  error?: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
}

/**
 * Busca propiedades en Idealista
 */
export async function searchProperties(params: SearchParams = {}): Promise<SearchResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/idealista/search?${queryParams.toString()}`);
  return response.json();
}

/**
 * Obtiene los detalles de una propiedad específica
 */
export async function getPropertyDetails(propertyCode: string): Promise<{
  success: boolean;
  property?: Record<string, unknown>;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/idealista/property/${propertyCode}`);
  return response.json();
}

/**
 * Obtiene la lista de ubicaciones disponibles
 */
export async function getLocations(): Promise<{
  success: boolean;
  locations?: Location[];
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/idealista/locations`);
  return response.json();
}

/**
 * Importa una propiedad por su URL de Idealista
 */
export async function importPropertyByUrl(url: string): Promise<{
  success: boolean;
  property?: IdealistaProperty & {
    zone?: string;
    description?: string;
    parkingIncluded?: boolean;
    terrace?: boolean;
  };
  error?: string;
  propertyId?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/idealista/import-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

/**
 * Ubicaciones predefinidas (fallback si la API no responde)
 */
export const DEFAULT_LOCATIONS: Location[] = [
  { id: '0-EU-ES-28-07-001-079', name: 'Madrid', type: 'city' },
  { id: '0-EU-ES-08-08-001-019', name: 'Barcelona', type: 'city' },
  { id: '0-EU-ES-46-46-001-250', name: 'Valencia', type: 'city' },
  { id: '0-EU-ES-41-41-001-091', name: 'Sevilla', type: 'city' },
  { id: '0-EU-ES-50-50-001-297', name: 'Zaragoza', type: 'city' },
  { id: '0-EU-ES-29-29-001-067', name: 'Malaga', type: 'city' },
  { id: '0-EU-ES-48-48-001-020', name: 'Bilbao', type: 'city' },
  { id: '0-EU-ES-03-03-001-014', name: 'Alicante', type: 'city' },
  { id: '0-EU-ES-30-30-001-030', name: 'Murcia', type: 'city' },
  { id: '0-EU-ES-07-07-001-040', name: 'Palma de Mallorca', type: 'city' },
];
