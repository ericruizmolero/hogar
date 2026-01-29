/**
 * Parser para Grupo Tomé (y potencialmente otras agencias con Inmovilla CRM).
 *
 * Fuente principal: JSON embebido en `listados.fichapropiedad` dentro de un <script>.
 * Fallback: selectores CSS del HTML de Inmovilla.
 */

import type { Property } from '../../types';
import type { PlatformParser } from './types';

interface InmovillaData {
  precioinmo?: number;
  ciudad?: string;
  zona?: string;
  m_cons?: number;
  m_uties?: number;
  habdobles?: number;
  total_hab?: number;
  banyos?: number;
  banyosauto?: number;
  antiguedad?: number;
  nborientacion?: string;
  nbtipo?: string;
  nbconservacion?: string;
  terraza?: number;
  ascensor?: number;
  jardin?: number;
  plaza_gara?: number;
  total_parking?: number;
  piscina_com?: number;
  latitud?: number;
  altitud?: number;
  agencia?: string;
  telefono?: string;
  email?: string;
  numfotos?: number;
  fotoletra?: number;
  srvfotos?: number;
  numagencia?: number;
  cod_ofer?: number;
  foto?: string;
  ref?: string;
  cod_ofer_str?: string;
  fechacreacion?: string;
}

function extractInmovillaJson(html: string): InmovillaData | null {
  // Buscar listados.fichapropiedad = [{...}, {...}];
  const match = html.match(/listados\.fichapropiedad\s*=\s*\[([^\]]*\{[\s\S]*?\})\s*\]/);
  if (!match) return null;

  try {
    const arrayContent = `[${match[1]}]`;
    const arr = JSON.parse(arrayContent);
    // El primer objeto es metadata (posicion, elementos, total), el segundo es la propiedad
    return arr.length > 1 ? arr[1] : arr[0];
  } catch {
    // Intentar parsear de forma más permisiva (a veces el JSON tiene trailing commas, etc.)
    try {
      // Buscar el objeto más grande (el de la propiedad)
      const objMatch = html.match(/listados\.fichapropiedad\s*=\s*\[[\s\S]*?,\s*(\{[\s\S]*?"precioinmo"[\s\S]*?\})\s*\]/);
      if (objMatch) {
        return JSON.parse(objMatch[1]);
      }
    } catch {
      // Fall through
    }
    return null;
  }
}

export const parseGrupoTomeHtml: PlatformParser = (html: string, providedUrl: string): Partial<Property> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getText = (selector: string): string => {
    const el = doc.querySelector(selector);
    return el?.textContent?.trim() || '';
  };

  const getNumber = (text: string): number => {
    const match = text.match(/[\d.,]+/);
    if (match) {
      return parseFloat(match[0].replace(/\./g, '').replace(',', '.')) || 0;
    }
    return 0;
  };

  // --- Fuente principal: JSON embebido ---
  const data = extractInmovillaJson(html);

  // --- URL ---
  let url = providedUrl;
  if (!url) {
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) url = canonical.getAttribute('href') || '';
    if (!url) {
      const ogUrl = doc.querySelector('meta[property="og:url"]');
      if (ogUrl) url = ogUrl.getAttribute('content') || '';
    }
  }

  // --- Precio ---
  let price = data?.precioinmo || 0;
  if (!price) {
    const priceText = getText('.fichapropiedad-precio');
    price = Math.round(getNumber(priceText));
  }

  // --- Título ---
  const title = getText('.fichapropiedad-tituloprincipal h1') || getText('h1') || getText('title');

  // --- Zona / Ciudad ---
  let zone = '';
  let address = '';
  if (data?.zona && data?.ciudad) {
    zone = data.zona;
    address = `${data.zona}, ${data.ciudad}`;
  } else {
    // Fallback: buscar en la lista de datos
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('zona') || label.includes('ciudad')) {
        address = value;
        // Formato: "Añorga / Donostia - San Sebastian"
        const parts = value.split('/').map((s) => s.trim());
        zone = parts[0] || '';
      }
    });
  }

  // --- Metros cuadrados ---
  let builtSquareMeters = data?.m_cons || 0;
  let usableSquareMeters = data?.m_uties || 0;

  if (!builtSquareMeters || !usableSquareMeters) {
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('construida') && !builtSquareMeters) {
        builtSquareMeters = getNumber(value);
      }
      if (label.includes('útil') && !usableSquareMeters) {
        usableSquareMeters = getNumber(value);
      }
    });
  }

  const squareMeters = builtSquareMeters || usableSquareMeters;

  // --- Habitaciones / Baños ---
  let rooms = data?.total_hab || data?.habdobles || 0;
  let bathrooms = data?.banyosauto || data?.banyos || 0;

  if (!rooms || !bathrooms) {
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('habitacion') && !rooms) rooms = parseInt(value, 10) || 0;
      if (label.includes('baño') && !bathrooms) bathrooms = parseInt(value, 10) || 0;
    });
  }

  // Fallback: barra de características del título
  if (!rooms) {
    const roomsEl = doc.querySelector('.fichapropiedad-caracteristicastitulo .habitaciones');
    if (roomsEl) rooms = parseInt(roomsEl.textContent || '', 10) || 0;
  }
  if (!bathrooms) {
    const bathEl = doc.querySelector('.fichapropiedad-caracteristicastitulo .banyos');
    if (bathEl) bathrooms = parseInt(bathEl.textContent || '', 10) || 0;
  }

  // --- Planta ---
  let floor = data?.nbtipo || '';
  if (!floor) {
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('tipo de propiedad') || label.includes('planta')) {
        floor = value;
      }
    });
  }

  // --- Año ---
  let yearBuilt = data?.antiguedad || 0;
  if (!yearBuilt) {
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('antigüedad') || label.includes('antiguedad')) {
        yearBuilt = parseInt(value, 10) || 0;
      }
    });
  }

  // --- Orientación ---
  let orientation = data?.nborientacion || '';
  if (!orientation) {
    const dataItems = doc.querySelectorAll('.fichapropiedad-listadatos li');
    dataItems.forEach((li) => {
      const label = li.querySelector('.caracteristica')?.textContent?.trim().toLowerCase() || '';
      const value = li.querySelector('.valor')?.textContent?.trim() || '';
      if (label.includes('orientación') || label.includes('orientacion')) {
        orientation = value;
      }
    });
  }

  // --- Características (calidades) ---
  const features = new Set<string>();
  doc.querySelectorAll('.fichapropiedad-listacalidades .etiqueta').forEach((el) => {
    features.add((el.textContent || '').trim().toLowerCase());
  });

  const terrace = data?.terraza === 1 || features.has('terraza');
  const elevator = data?.ascensor === 1 || features.has('ascensor');
  const parkingIncluded = (data?.plaza_gara || 0) > 0 || (data?.total_parking || 0) > 0 || features.has('garaje incluido');
  const balcony = features.has('balcón') || features.has('balcon');
  const parkingOptional = features.has('garaje opcional') || features.has('parking opcional');

  // --- Renovación ---
  const fullText = doc.body?.textContent?.toLowerCase() || html.toLowerCase();
  const hasFullRenovation = fullText.includes('reforma integral') || fullText.includes('reforma total');
  const hasAnyRenovation = fullText.includes('a reformar') || fullText.includes('para reformar') || fullText.includes('necesita reforma');
  const needsRenovation = hasFullRenovation
    ? ('total' as const)
    : hasAnyRenovation
      ? ('partial' as const)
      : ('no' as const);

  // --- Coordenadas ---
  const latitude = data?.latitud || undefined;
  const longitude = data?.altitud || undefined; // Inmovilla usa "altitud" para longitud

  // --- Fotos ---
  const photos: string[] = [];

  if (data?.numfotos && data?.fotoletra && data?.srvfotos && data?.numagencia && data?.cod_ofer) {
    // Construir URLs de foto desde los datos JSON
    for (let i = 1; i <= data.numfotos; i++) {
      photos.push(
        `https://fotos${data.srvfotos}.apinmo.com/${data.numagencia}/${data.cod_ofer}/${data.fotoletra}-${i}.jpg`
      );
    }
  } else {
    // Fallback: buscar URLs de apinmo en el HTML
    const imgPattern = /https?:\/\/fotos\d+\.apinmo\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
    const matches = html.matchAll(imgPattern);
    const seen = new Set<string>();
    for (const match of matches) {
      const imgUrl = match[0];
      // Excluir thumbnails (terminan en 's.jpg')
      if (imgUrl.match(/-\d+s\./)) continue;
      if (!seen.has(imgUrl)) {
        seen.add(imgUrl);
        photos.push(imgUrl);
      }
    }
  }

  // --- Contacto ---
  const contactAgency = data?.agencia || getText('.datosagencia-nombre') || 'Grupo Tomé';
  const contactPhone = data?.telefono || getText('.datosagencia-telf').replace(/\s/g, '') || '';
  const contactEmail = data?.email || '';

  // --- Días publicado ---
  let daysPublished = 0;
  if (data?.fechacreacion) {
    const created = new Date(data.fechacreacion);
    if (!isNaN(created.getTime())) {
      daysPublished = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    url,
    title: title.replace(/\s+/g, ' ').trim(),
    address: address.replace(/\s+/g, ' ').trim(),
    zone,
    price,
    pricePerMeter: squareMeters > 0 ? Math.round(price / squareMeters) : 0,
    squareMeters,
    builtSquareMeters: Math.round(builtSquareMeters),
    usableSquareMeters: Math.round(usableSquareMeters),
    rooms,
    bathrooms,
    floor,
    terrace,
    balcony,
    elevator,
    parkingIncluded,
    parkingOptional,
    needsRenovation,
    yearBuilt,
    orientation,
    daysPublished,
    photos,
    latitude,
    longitude,
    contact: {
      phone: contactPhone,
      email: contactEmail,
      name: '',
      agency: contactAgency,
    },
    status: 'pending',
    notes: (() => {
      // Descripción del anuncio
      const descEl = doc.querySelector('.fichapropiedad-texto p, .fichapropiedad-texto, .fichapropiedad-descripcion p, .fichapropiedad-descripcion');
      if (descEl) {
        const t = descEl.textContent?.trim() || '';
        if (t.length > 30) return t;
      }
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
      return ogDesc || '';
    })(),
  };
};
