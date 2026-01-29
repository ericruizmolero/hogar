import type { Property } from '../../types';

/**
 * Firma común para todos los parsers de plataforma.
 */
export type PlatformParser = (html: string, providedUrl: string) => Partial<Property>;

/**
 * Definición de una plataforma soportada.
 */
export interface PlatformDefinition {
  id: string;
  label: string;
  /** Dominios para auto-detección de URL y whitelist del proxy de imágenes */
  domains: string[];
  parse: PlatformParser;
  /** Header Referer que el proxy debe enviar para las imágenes de esta plataforma */
  imageReferer: string;
}
