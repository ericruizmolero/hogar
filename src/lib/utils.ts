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

// Devuelve la URL de la imagen, usando proxy para URLs de Idealista
export function getImageUrl(url: string): string {
  // Si ya es base64 o data URL, devolver tal cual
  if (url.startsWith('data:')) {
    return url;
  }

  // Si es una URL de Idealista, usar el proxy para evitar CORS
  if (url.includes('idealista.com')) {
    const apiUrl = import.meta.env.DEV
      ? 'http://localhost:5001'
      : (import.meta.env.VITE_API_URL || '');
    return `${apiUrl}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // Para otras URLs (Firebase Storage, etc.), devolver tal cual
  return url;
}
