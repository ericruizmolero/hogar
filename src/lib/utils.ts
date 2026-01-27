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

// Proxy para imágenes de Idealista (evita bloqueo por hotlink)
export function getImageUrl(url: string): string {
  if (url.includes('idealista.com')) {
    return `http://localhost:5001/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
