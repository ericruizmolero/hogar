import type { PlatformDefinition } from './types';
import { parseIdealistaHtml } from './idealista';
import { parseGrupoTomeHtml } from './grupotome';
import { parseEngelVolkersHtml } from './engelvolkers';
import { parseFotocasaHtml } from './fotocasa';
import { parseAreizagaHtml } from './areizaga';

/**
 * Registro de plataformas soportadas.
 * Para añadir una nueva: importar su parser y añadir una entrada aquí.
 */
export const platformRegistry = new Map<string, PlatformDefinition>([
  [
    'idealista',
    {
      id: 'idealista',
      label: 'Idealista',
      domains: ['idealista.com'],
      parse: parseIdealistaHtml,
      imageReferer: 'https://www.idealista.com/',
    },
  ],
  [
    'grupotome',
    {
      id: 'grupotome',
      label: 'Grupo Tomé',
      domains: ['grupotome.com'],
      parse: parseGrupoTomeHtml,
      imageReferer: 'https://www.grupotome.com/',
    },
  ],
  [
    'engelvolkers',
    {
      id: 'engelvolkers',
      label: 'Engel & Völkers',
      domains: ['engelvoelkers.com'],
      parse: parseEngelVolkersHtml,
      imageReferer: 'https://www.engelvoelkers.com/',
    },
  ],
  [
    'fotocasa',
    {
      id: 'fotocasa',
      label: 'Fotocasa',
      domains: ['fotocasa.es'],
      parse: parseFotocasaHtml,
      imageReferer: 'https://www.fotocasa.es/',
    },
  ],
  [
    'areizaga',
    {
      id: 'areizaga',
      label: 'Areizaga',
      domains: ['areizaga.com'],
      parse: parseAreizagaHtml,
      imageReferer: 'https://www.areizaga.com/',
    },
  ],
]);

/**
 * Lista de opciones para el dropdown de plataformas.
 */
export function getPlatformOptions(): { value: string; label: string }[] {
  return Array.from(platformRegistry.values()).map((p) => ({
    value: p.id,
    label: p.label,
  }));
}

/**
 * Auto-detecta la plataforma a partir de una URL.
 */
export function detectPlatformFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  for (const [id, platform] of platformRegistry) {
    if (platform.domains.some((domain) => lower.includes(domain))) {
      return id;
    }
  }
  return null;
}
