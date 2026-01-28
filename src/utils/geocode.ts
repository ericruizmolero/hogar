/**
 * Extrae la calle/dirección de un título de Idealista
 * Ej: "Piso en venta en Calle Atotxaerreka Bidea, 91" -> "Calle Atotxaerreka Bidea, 91"
 */
function extractStreetFromTitle(title: string): string | null {
  // Buscar "en Calle/Avenida/Paseo/etc + nombre"
  const streetPattern = /en\s+((?:calle|avenida|paseo|plaza|travesía|camino|barrio|urbanización)\s+.+)/i;
  const match = title.match(streetPattern);
  if (match) {
    return match[1].trim();
  }

  // Fallback: todo después del último "en "
  const lastEnPattern = /^.+\ben\s+(.+)$/i;
  const fallback = title.match(lastEnPattern);
  if (fallback) {
    return fallback[1].trim();
  }

  return null;
}

/**
 * Geocodifica una query usando OpenStreetMap Nominatim
 */
async function geocodeQuery(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'es',
      }),
      {
        headers: {
          'User-Agent': 'HogarApp/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error('Error geocoding:', error);
  }

  return null;
}

/**
 * Intenta geocodificar con múltiples variantes de ciudad
 */
async function geocodeWithVariants(query: string): Promise<{ lat: number; lon: number } | null> {
  // Probar con San Sebastián
  let result = await geocodeQuery(`${query}, San Sebastián, España`);
  if (result) return result;

  // Probar con Donostia (nombre en euskera)
  result = await geocodeQuery(`${query}, Donostia`);
  if (result) return result;

  return null;
}

/**
 * Extrae posible nombre de barrio del nombre de una calle
 * Ej: "Calle Atotxaerreka Bidea" -> "Atotxa" (elimina sufijos comunes)
 */
function extractNeighborhoodFromStreet(street: string): string | null {
  // Quitar prefijos como "Calle", "Avenida", etc.
  const withoutPrefix = street.replace(/^(calle|avenida|paseo|plaza|travesía|camino)\s+/i, '');

  // Obtener la primera palabra (suele ser el nombre del barrio)
  const firstWord = withoutPrefix.split(/[\s,]/)[0];

  // Quitar sufijos vascos comunes de calles (-erreka, -bide, -bidea, -kalea, etc.)
  const cleaned = firstWord.replace(/(erreka|bidea?|kalea|enea|etxea)$/i, '');

  if (cleaned.length >= 3) {
    return cleaned;
  }
  return null;
}

/**
 * Extrae posibles barrios de un texto (descripción/notas)
 * Busca patrones como "en Aiete", "barrio de Gros", "zona de Amara"
 */
function extractNeighborhoodsFromText(text: string): string[] {
  const neighborhoods: string[] = [];

  // Patrones comunes para mencionar barrios
  const patterns = [
    /\ben\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s*,|\s*\.|\s+uno|\s+el|\s+la|\s+con|\s+muy|\s+de\s+(?:Donostia|San\s*Sebastián))/gi,
    /barrio\s+(?:de\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/gi,
    /zona\s+(?:de\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/gi,
    /ubicado\s+en\s+(?:zona\s+)?(?:tranquila\s*,?\s*)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filtrar palabras comunes que no son barrios
      const excluded = ['piso', 'casa', 'ático', 'apartamento', 'planta', 'exterior', 'interior', 'muy', 'con', 'sin', 'una', 'uno', 'dos', 'tres'];
      if (name.length >= 3 && !excluded.includes(name.toLowerCase())) {
        neighborhoods.push(name);
      }
    }
  }

  return [...new Set(neighborhoods)]; // Eliminar duplicados
}

/**
 * Geocodifica una propiedad probando múltiples fuentes:
 * 1. Dirección directa
 * 2. Calle extraída del título
 * 3. Barrio extraído del nombre de calle
 * 4. Zona/barrio
 * 5. Barrios mencionados en la descripción
 */
export async function geocodeProperty(
  address: string,
  title: string,
  zone: string,
  notes?: string
): Promise<{ lat: number; lon: number } | null> {
  // 1. Intentar con la dirección
  if (address) {
    const result = await geocodeWithVariants(address);
    if (result) return result;
  }

  // 2. Intentar extraer calle del título
  const streetFromTitle = extractStreetFromTitle(title);
  if (streetFromTitle) {
    // 2a. Probar calle completa
    let result = await geocodeWithVariants(streetFromTitle);
    if (result) return result;

    // 2b. Probar primera palabra de la calle (puede ser nombre de barrio)
    const withoutPrefix = streetFromTitle.replace(/^(calle|avenida|paseo|plaza|travesía|camino)\s+/i, '');
    const firstWord = withoutPrefix.split(/[\s,]/)[0];
    if (firstWord && firstWord.length >= 3) {
      result = await geocodeWithVariants(firstWord);
      if (result) return result;
    }

    // 2c. Intentar quitando sufijos vascos (último recurso)
    const neighborhood = extractNeighborhoodFromStreet(streetFromTitle);
    if (neighborhood && neighborhood !== firstWord) {
      result = await geocodeWithVariants(neighborhood);
      if (result) return result;
    }
  }

  // 3. Intentar con la zona/barrio
  if (zone) {
    const result = await geocodeWithVariants(zone);
    if (result) return result;
  }

  // 4. Buscar barrios en la descripción/notas
  if (notes) {
    const neighborhoodsFromNotes = extractNeighborhoodsFromText(notes);
    for (const neighborhood of neighborhoodsFromNotes) {
      const result = await geocodeWithVariants(neighborhood);
      if (result) return result;
    }
  }

  // 5. Buscar barrios en el título también
  const neighborhoodsFromTitle = extractNeighborhoodsFromText(title);
  for (const neighborhood of neighborhoodsFromTitle) {
    const result = await geocodeWithVariants(neighborhood);
    if (result) return result;
  }

  return null;
}

