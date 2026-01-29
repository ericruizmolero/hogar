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

/**
 * Dominios cuyas imágenes necesitan pasar por el proxy para evitar CORS.
 * Debe coincidir con ALLOWED_IMAGE_DOMAINS en server.py.
 */
const PROXIED_IMAGE_DOMAINS = [
  'idealista.com',
  'fotocasa.es',
  'pisos.com',
  'habitaclia.com',
  'apinmo.com',
  'engelvoelkers.com',
  'ucarecdn.com',
  'inmotek.net',
];

// Devuelve la URL de la imagen, usando proxy para dominios conocidos
export function getImageUrl(url: string): string {
  if (!url || url.startsWith('data:')) {
    return url;
  }

  const needsProxy = PROXIED_IMAGE_DOMAINS.some((domain) => url.includes(domain));
  if (needsProxy) {
    const apiUrl = import.meta.env.DEV
      ? 'http://localhost:5001'
      : (import.meta.env.VITE_API_URL || '');
    return `${apiUrl}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

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
