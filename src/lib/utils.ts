export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function calculatePricePerMeter(price: number, squareMeters: number): number {
  if (squareMeters === 0) return 0;
  return Math.round(price / squareMeters);
}

// Devuelve la URL de la imagen tal cual.
// Las imágenes se cargan directamente con referrerPolicy="no-referrer" en los <img>,
// lo que evita el bloqueo por hotlinking sin necesidad de proxy.
// El proxy (/api/image-proxy) solo se usa en storage.ts para la migración a Firebase.
export function getImageUrl(url: string): string {
  if (!url || url.startsWith('data:')) return url;
  return url;
}

/**
 * Devuelve el nombre legible de la plataforma a partir de la URL del anuncio.
 * Ej: "https://www.idealista.com/…" → "Idealista"
 */
export function getProviderLabel(url: string): string {
  // Importar dinámicamente evitaría dependencia circular, pero las constantes
  // son ligeras, así que mapeamos directamente por dominio.
  const domainLabels: Record<string, string> = {
    'idealista.com': 'Idealista',
    'fotocasa.es': 'Fotocasa',
    'grupotome.com': 'Grupo Tomé',
    'engelvoelkers.com': 'Engel & Völkers',
    'areizaga.com': 'Areizaga',
  };
  const lower = url.toLowerCase();
  for (const [domain, label] of Object.entries(domainLabels)) {
    if (lower.includes(domain)) return label;
  }
  return 'proveedor';
}
