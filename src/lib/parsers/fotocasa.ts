/**
 * Parser para Fotocasa.
 *
 * Los datos de la propiedad están en el HTML renderizado (React SSR):
 *   - Precio en texto plano cerca de <h1>.
 *   - Características en pares <dt>/<dd> (habitaciones, baños, m², ascensor…).
 *   - Imágenes desde static.fotocasa.es/images/ads/{uuid}?rule=…
 *   - Ubicación en breadcrumbs y título.
 *   - Contacto/agencia en sección dedicada.
 */

import type { Property } from '../../types';
import type { PlatformParser } from './types';

export const parseFotocasaHtml: PlatformParser = (html: string, providedUrl: string): Partial<Property> => {
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

  // --- URL ---
  let url = providedUrl;
  if (!url) {
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) url = canonical.getAttribute('href') || '';
    if (!url) {
      const ogUrl = doc.querySelector('meta[property="og:url"]');
      if (ogUrl) url = ogUrl.getAttribute('content') || '';
    }
    if (!url) {
      const match = html.match(/https:\/\/www\.fotocasa\.es\/[^"'\s]+\/\d+/);
      if (match) url = match[0];
    }
  }

  // --- Título ---
  const title = getText('h1') || getText('.re-DetailHeader-propertyTitle') || getText('title') || '';

  // --- Precio ---
  let price = 0;

  // Buscar en selectores conocidos de Fotocasa
  const priceSelectors = [
    '.re-DetailHeader-price',
    '.re-DetailHeader-priceContainer',
    '[class*="Price"]',
    '[class*="price"]',
    '[data-testid="price"]',
  ];
  for (const sel of priceSelectors) {
    const text = getText(sel);
    if (text) {
      const val = Math.round(getNumber(text));
      if (val > 1000) {
        price = val;
        break;
      }
    }
  }

  // Fallback: buscar patron de precio en el texto (XXX.XXX €)
  if (!price) {
    const fullText = doc.body?.textContent || '';
    const priceMatch = fullText.match(/(\d{1,3}(?:\.\d{3})+)\s*€/);
    if (priceMatch) {
      price = Math.round(getNumber(priceMatch[1]));
    }
  }

  // --- Zona / Dirección ---
  let zone = '';
  let address = '';

  // Extraer de breadcrumbs
  const breadcrumbs = doc.querySelectorAll(
    '[class*="Breadcrumb"] a, [class*="breadcrumb"] a, nav[aria-label*="Breadcrumb"] a, nav[aria-label*="breadcrumb"] a, .re-Breadcrumb a, .re-Breadcrumb-link'
  );
  if (breadcrumbs.length > 0) {
    const parts: string[] = [];
    breadcrumbs.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && !text.toLowerCase().includes('fotocasa') && !text.toLowerCase().includes('inicio')) {
        parts.push(text);
      }
    });
    if (parts.length > 0) {
      zone = parts[parts.length - 1];
      address = parts.join(', ');
    }
  }

  // Fallback: extraer del título "Piso en venta en ZONA, CIUDAD"
  if (!zone && title) {
    const titleMatch = title.match(/(?:en venta|en alquiler)\s+en\s+(.+)/i);
    if (titleMatch) {
      const locationPart = titleMatch[1];
      const parts = locationPart.split(',').map((s) => s.trim());
      address = locationPart;
      zone = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }
  }

  // Buscar zona/barrio en selectores de Fotocasa
  if (!zone) {
    const locationSelectors = [
      '.re-DetailMap-address',
      '.re-DetailHeader-address',
      '[class*="Location"]',
      '[class*="location"]',
      '[class*="Address"]',
      '[class*="address"]',
    ];
    for (const sel of locationSelectors) {
      const text = getText(sel);
      if (text) {
        address = text;
        const parts = text.split(',').map((s) => s.trim());
        zone = parts[parts.length - 1] || parts[0] || '';
        break;
      }
    }
  }

  // --- Características (dt/dd) ---
  let builtSquareMeters = 0;
  let usableSquareMeters = 0;
  let rooms = 0;
  let bathrooms = 0;
  let floor = '';
  let elevator = false;
  let terrace = false;
  let balcony = false;
  let parkingIncluded = false;
  let parkingOptional = false;
  let orientation = '';

  // Fotocasa usa pares dt/dd para las características
  const dtElements = doc.querySelectorAll('dt');
  dtElements.forEach((dt) => {
    const label = (dt.textContent || '').trim().toLowerCase();
    const dd = dt.nextElementSibling;
    if (!dd || dd.tagName !== 'DD') return;
    const value = (dd.textContent || '').trim();
    const valueLower = value.toLowerCase();

    if (label.includes('habitaci') || label.includes('dormitorio') || label.includes('bedroom')) {
      if (!rooms) rooms = parseInt(value, 10) || 0;
    } else if (label.includes('baño') || label.includes('bathroom')) {
      if (!bathrooms) bathrooms = parseInt(value, 10) || 0;
    } else if (label.includes('superficie') || label.includes('m²') || label.includes('tamaño') || label.includes('surface')) {
      const val = getNumber(value);
      if (val > 0) {
        if (label.includes('útil') || label.includes('usable') || label.includes('neta')) {
          usableSquareMeters = val;
        } else if (label.includes('construid') || label.includes('built')) {
          builtSquareMeters = val;
        } else {
          // Genérico: asumimos construidos si no se especifica
          if (!builtSquareMeters) builtSquareMeters = val;
        }
      }
    } else if (label.includes('planta') || label.includes('floor')) {
      floor = value;
    } else if (label.includes('ascensor') || label.includes('elevator') || label.includes('lift')) {
      elevator = valueLower === 'sí' || valueLower === 'si' || valueLower === 'yes' || valueLower === '1';
    } else if (label.includes('terraza') || label.includes('terrace')) {
      terrace = valueLower === 'sí' || valueLower === 'si' || valueLower === 'yes' || valueLower === '1';
    } else if (label.includes('balcón') || label.includes('balcon') || label.includes('balcony')) {
      balcony = valueLower === 'sí' || valueLower === 'si' || valueLower === 'yes' || valueLower === '1';
    } else if (label.includes('garaje') || label.includes('parking') || label.includes('aparcamiento')) {
      if (valueLower.includes('incluid')) {
        parkingIncluded = true;
      } else if (valueLower.includes('opcional')) {
        parkingOptional = true;
      } else if (valueLower === 'sí' || valueLower === 'si' || valueLower === 'yes') {
        parkingIncluded = true;
      }
    } else if (label.includes('orientaci') || label.includes('orientation')) {
      orientation = value;
    }
  });

  // Fallback: buscar features en spans/li genéricos (a veces Fotocasa los lista así)
  if (!rooms || !bathrooms || !builtSquareMeters) {
    const featureElements = doc.querySelectorAll(
      '[class*="feature"] li, [class*="Feature"] li, [class*="detail"] li, [class*="Detail"] span'
    );
    featureElements.forEach((el) => {
      const text = (el.textContent || '').toLowerCase();
      if (!rooms && (text.includes('hab') || text.includes('dormitorio'))) {
        rooms = parseInt(text, 10) || getNumber(text);
      }
      if (!bathrooms && text.includes('baño')) {
        bathrooms = parseInt(text, 10) || getNumber(text);
      }
      if (!builtSquareMeters && text.includes('m²')) {
        const val = getNumber(text);
        if (val > 10 && val < 10000) builtSquareMeters = val;
      }
    });
  }

  const squareMeters = builtSquareMeters || usableSquareMeters;

  // --- Texto completo para búsquedas de features ---
  const fullText = (doc.body?.textContent || html).toLowerCase();

  // Complementar features booleanas con regex si no se encontraron en dt/dd
  if (!terrace) terrace = /\bterraza\b/i.test(fullText);
  if (!balcony) balcony = /\bbalc[oó]n\b/i.test(fullText);
  if (!elevator) {
    elevator = /\bascensor\b/i.test(fullText) && !/\bsin\s+ascensor\b/i.test(fullText);
  }
  if (!parkingIncluded && !parkingOptional) {
    parkingIncluded = /garaje\s*incluid|plaza.*incluid/i.test(fullText);
    parkingOptional = /garaje\s*opcional|plaza.*opcional|posibilidad.*garaje/i.test(fullText);
  }

  // --- Renovación ---
  const hasFullRenovation = /reforma\s+integral|reforma\s+total/i.test(fullText);
  const hasAnyRenovation = /a\s+reformar|para\s+reformar|necesita\s+reforma/i.test(fullText);
  const needsRenovation = hasFullRenovation
    ? ('total' as const)
    : hasAnyRenovation
      ? ('partial' as const)
      : ('no' as const);

  // --- Año construcción ---
  let yearBuilt = 0;
  const yearMatch =
    fullText.match(/(?:construido|construcci[oó]n|a[ñn]o)\s*(?:en)?\s*[:\s]*(\d{4})/) ||
    fullText.match(/(\d{4})\s*(?:construido|construcci[oó]n)/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y >= 1800 && y <= 2030) yearBuilt = y;
  }

  // --- Orientación fallback ---
  if (!orientation) {
    const orientMatch = fullText.match(
      /orientaci[oó]n\s*[:\s]*(norte|sur|este|oeste|noroeste|noreste|suroeste|sureste)/i
    );
    if (orientMatch) orientation = orientMatch[1].charAt(0).toUpperCase() + orientMatch[1].slice(1);
  }

  // --- Días publicado ---
  let daysPublished = 0;
  const daysMatch =
    fullText.match(/hace\s+(\d+)\s+d[ií]as?/) ||
    fullText.match(/publicado\s+hace\s+(\d+)\s+d[ií]as?/);
  if (daysMatch) daysPublished = parseInt(daysMatch[1], 10);

  // --- Coordenadas ---
  let latitude: number | undefined;
  let longitude: number | undefined;

  const latMatch =
    html.match(/"latitude"\s*:\s*([\d.-]+)/) ||
    html.match(/lat[itude]*['"]\s*:\s*([\d.-]+)/);
  const lngMatch =
    html.match(/"longitude"\s*:\s*([\d.-]+)/) ||
    html.match(/lng|lon[gitude]*['"]\s*:\s*([\d.-]+)/);
  if (latMatch) {
    const lat = parseFloat(latMatch[1]);
    if (lat >= -90 && lat <= 90) latitude = lat;
  }
  if (lngMatch) {
    const lng = parseFloat(lngMatch[1]);
    if (lng >= -180 && lng <= 180) longitude = lng;
  }

  // --- Fotos ---
  const photos: string[] = [];
  const seenPhotos = new Set<string>();

  const addPhoto = (imgUrl: string) => {
    if (!imgUrl) return;
    // Solo imágenes de Fotocasa
    if (!imgUrl.includes('fotocasa.es') && !imgUrl.includes('fotocasa')) return;
    // Excluir logos, iconos, tracking, avatars
    if (/logo|icon|avatar|favicon|placeholder|pixel|tracking|bat\.bing|loading/i.test(imgUrl)) return;
    // Solo formatos de imagen
    if (!imgUrl.match(/\.(jpg|jpeg|png|webp)|images\/ads\//i)) return;

    // Deduplicar por UUID de la imagen
    const uuidMatch = imgUrl.match(/images\/ads\/([a-f0-9-]{36})/i);
    const dedupeKey = uuidMatch ? uuidMatch[1] : imgUrl.split('?')[0];
    if (seenPhotos.has(dedupeKey)) return;
    seenPhotos.add(dedupeKey);

    // Maximizar resolución: usar rule=web_948x542_ar (la más grande conocida)
    let finalUrl = imgUrl;
    if (uuidMatch) {
      finalUrl = `https://static.fotocasa.es/images/ads/${uuidMatch[1]}?rule=web_948x542_ar`;
    }

    photos.push(finalUrl);
  };

  // Buscar URLs de imágenes de Fotocasa en el HTML completo
  const fotocasaImgPattern = /https?:\/\/static\.fotocasa\.es\/images\/ads\/[a-f0-9-]+(?:\?[^"'\s<>]*)?/gi;
  for (const match of html.matchAll(fotocasaImgPattern)) {
    addPhoto(match[0]);
  }

  // Buscar en img tags del DOM
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || '';
    addPhoto(src);
    const srcset = img.getAttribute('srcset') || '';
    if (srcset.includes('fotocasa')) {
      srcset.split(',').forEach((part) => {
        addPhoto(part.trim().split(' ')[0]);
      });
    }
  });

  // Buscar en source tags
  doc.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset') || '';
    if (srcset.includes('fotocasa')) {
      srcset.split(',').forEach((part) => {
        addPhoto(part.trim().split(' ')[0]);
      });
    }
  });

  // Buscar en background-image styles
  doc.querySelectorAll('[style*="fotocasa"]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const bgMatch = style.match(/url\(["']?(https?:\/\/[^"')]+fotocasa[^"')]+)["']?\)/);
    if (bgMatch) addPhoto(bgMatch[1]);
  });

  // og:image como fallback
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) addPhoto(ogImage.getAttribute('content') || '');

  // --- Contacto ---
  let contactPhone = '';
  let contactAgency = '';
  let contactEmail = '';
  let contactName = '';

  // Buscar agencia en selectores de Fotocasa
  const agencySelectors = [
    '.re-DetailContactProfessional-name',
    '[class*="ContactProfessional"] a',
    '[class*="contactProfessional"]',
    '[class*="Agency"]',
    '[class*="agency"]',
    '[class*="Advertiser"]',
    '[class*="advertiser"]',
    '[class*="promotor"]',
    '[class*="Promotor"]',
  ];
  for (const sel of agencySelectors) {
    const text = getText(sel);
    if (text && text.length > 1 && text.length < 100) {
      contactAgency = text;
      break;
    }
  }

  // Fallback: buscar enlaces que parezcan de agencia
  if (!contactAgency) {
    doc.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent?.trim() || '';
      if (
        (href.includes('/agencia/') || href.includes('/promotora/') || href.includes('/professional/')) &&
        text.length > 1 &&
        text.length < 100
      ) {
        if (!contactAgency) contactAgency = text;
      }
    });
  }

  // Teléfono
  doc.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    const phone = link.getAttribute('href')?.replace('tel:', '').replace(/\s/g, '') || '';
    if (phone && phone.length >= 9 && !contactPhone) {
      contactPhone = phone;
    }
  });

  if (!contactPhone) {
    const phoneMatch = fullText.match(/\b([679]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/);
    if (phoneMatch) contactPhone = phoneMatch[1].replace(/[\s.-]/g, '');
  }

  // Email
  const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) contactEmail = emailMatch[0];

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
      name: contactName,
      agency: contactAgency,
    },
    status: 'pending',
    notes: (() => {
      // Descripción del anuncio
      const descEl = doc.querySelector('.re-DetailDescription-text, [class*="Description"] p, [class*="description"] p');
      if (descEl) {
        const t = descEl.textContent?.trim() || '';
        if (t.length > 30) return t;
      }
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
      return ogDesc || '';
    })(),
  };
};
