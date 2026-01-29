/**
 * Parser para Areizaga Inmobiliaria.
 *
 * La web es WordPress + Inmotek CRM. Los datos están en HTML semántico:
 *   - Título: h2.single-title
 *   - Features: span.metros-utiles, span.numero-habitaciones, span.numero-banos
 *   - Detalles: bloques .web-iconbox-cont (metros, orientación, planta, etc.)
 *   - Imágenes: a.web-gallery-item img (dominio img.inmotek.net)
 *   - Coordenadas y agencia: JSON-LD (Place + RealEstateAgent schemas)
 */

import type { Property } from '../../types';
import type { PlatformParser } from './types';

export const parseAreizagaHtml: PlatformParser = (html: string, providedUrl: string): Partial<Property> => {
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

  // --- JSON-LD ---
  let jsonLdGraph: Record<string, unknown>[] = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      const graph = data?.['@graph'];
      if (Array.isArray(graph)) {
        jsonLdGraph = graph.filter((item: unknown) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
      }
    } catch { /* ignore */ }
  });

  // Fallback regex
  if (jsonLdGraph.length === 0) {
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const graph = data?.['@graph'];
        if (Array.isArray(graph)) {
          jsonLdGraph = graph.filter((item: unknown) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
        }
      } catch { /* ignore */ }
    }
  }

  const findLdType = (type: string) =>
    jsonLdGraph.find(
      (b) => typeof b['@type'] === 'string' && b['@type'].toLowerCase().includes(type.toLowerCase()),
    );

  const placeLd = findLdType('Place');
  const agentLd = findLdType('RealEstateAgent');

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

  // --- Título ---
  const title =
    getText('h2.single-title') ||
    getText('h1.single-title') ||
    getText('h1') ||
    getText('title') ||
    '';

  // --- Precio ---
  let price = 0;
  // Buscar <strong> que contenga €
  doc.querySelectorAll('strong').forEach((el) => {
    const text = el.textContent || '';
    if (text.includes('€') && !price) {
      price = Math.round(getNumber(text));
    }
  });
  // Fallback: regex
  if (!price) {
    const priceMatch = html.match(/(\d{1,3}(?:\.\d{3})+)\s*€/);
    if (priceMatch) price = Math.round(getNumber(priceMatch[1]));
  }

  // --- Zona / Dirección ---
  let zone = '';
  let address = '';

  // "Piso en Egia" span
  const fullText = doc.body?.textContent || '';
  const typeZoneMatch = fullText.match(/(?:Piso|Casa|Chalet|Ático|Dúplex|Villa|Apartamento|Estudio)\s+en\s+([^\n,]+)/i);
  if (typeZoneMatch) {
    zone = typeZoneMatch[1].trim();
  }

  // JSON-LD address
  const ldAddress = placeLd?.address as Record<string, string> | undefined;
  if (ldAddress) {
    const street = ldAddress.streetAddress || '';
    const city = ldAddress.addressLocality || '';
    address = [street, zone || city].filter(Boolean).join(', ');
    if (!zone && city) zone = city;
  }

  // Fallback: extraer zona del título ("... en ZONA")
  if (!zone && title) {
    const zoneMatch = title.match(/en\s+([^,.]+)$/i);
    if (zoneMatch) zone = zoneMatch[1].trim();
  }

  // --- Metros cuadrados ---
  let builtSquareMeters = 0;
  let usableSquareMeters = 0;

  // Spans con clases específicas
  const usableText = getText('span.metros-utiles');
  if (usableText) usableSquareMeters = getNumber(usableText);

  // Bloques .web-iconbox-cont para metros construidos y útiles
  doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
    const text = box.textContent || '';
    const builtMatch = text.match(/[Mm]etros\s+construidos\s*:\s*([\d.,]+)/);
    if (builtMatch && !builtSquareMeters) builtSquareMeters = getNumber(builtMatch[1]);
    const usableMatch = text.match(/[Mm]etros\s+útiles\s*:\s*([\d.,]+)/);
    if (usableMatch && !usableSquareMeters) usableSquareMeters = getNumber(usableMatch[1]);
  });

  const squareMeters = builtSquareMeters || usableSquareMeters;

  // --- Habitaciones ---
  let rooms = 0;
  const roomsText = getText('span.numero-habitaciones');
  if (roomsText) rooms = parseInt(roomsText, 10) || getNumber(roomsText);
  if (!rooms) {
    doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
      const text = box.textContent || '';
      const match = text.match(/[Hh]abitaciones\s*:\s*(\d+)/);
      if (match && !rooms) rooms = parseInt(match[1], 10);
    });
  }

  // --- Baños ---
  let bathrooms = 0;
  const bathText = getText('span.numero-banos');
  if (bathText) bathrooms = parseInt(bathText, 10) || getNumber(bathText);
  if (!bathrooms) {
    doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
      const text = box.textContent || '';
      const match = text.match(/[Bb]año\w*\s*:\s*(\d+)/);
      if (match && !bathrooms) bathrooms = parseInt(match[1], 10);
    });
  }

  // --- Planta ---
  let floor = '';
  // Desde web-iconbox-cont "Altura de la vivienda: N"
  doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
    const text = box.textContent || '';
    const match = text.match(/[Aa]ltura\s+de\s+la\s+vivienda\s*:\s*(\d+)/);
    if (match && !floor) floor = `Planta ${match[1]}`;
  });
  // Fallback: regex "Nª planta" en el texto
  if (!floor) {
    const floorMatch = fullText.match(/(\d+)[ªº]?\s*planta/i);
    if (floorMatch) floor = `Planta ${floorMatch[1]}`;
  }

  // --- Orientación ---
  let orientation = '';
  doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
    const text = box.textContent || '';
    const match = text.match(/[Oo]rientación\s*:\s*(Norte|Sur|Este|Oeste|Noroeste|Noreste|Suroeste|Sureste)/i);
    if (match && !orientation) orientation = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  });
  if (!orientation) {
    const om = fullText.match(
      /orientación\s*[:\s]*(norte|sur|este|oeste|noroeste|noreste|suroeste|sureste)/i,
    );
    if (om) orientation = om[1].charAt(0).toUpperCase() + om[1].slice(1);
  }

  // --- Año / Conservación ---
  let yearBuilt = 0;
  const yearMatch =
    fullText.match(/(?:construido|construcción|año|reformad)\s*(?:en)?\s*[:\s]*(\d{4})/i) ||
    fullText.match(/(\d{4})\s*(?:construido|construcción)/i);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y >= 1800 && y <= 2030) yearBuilt = y;
  }

  // --- Características booleanas ---
  const searchLower = fullText.toLowerCase();

  const terrace = /\bterraza\b/i.test(searchLower);
  const balcony = /\bbalc[oó]n\b/i.test(searchLower);

  // Ascensor: Areizaga indica "sin ascensor" o tiene label "Ascensor"
  let elevator = false;
  const hasElevatorKeyword = /\bascensor\b/i.test(searchLower);
  const sinAscensor = /sin\s+ascensor/i.test(searchLower);
  if (hasElevatorKeyword && !sinAscensor) elevator = true;
  // Check in iconbox: si solo dice "Ascensor" como feature, es que tiene
  doc.querySelectorAll('.web-iconbox-cont').forEach((box) => {
    const text = (box.textContent || '').trim().toLowerCase();
    if (text === 'ascensor') elevator = true;
  });

  const parkingIncluded = /garaje\s*incluid|plaza.*incluid/i.test(searchLower);
  const parkingOptional = /garaje\s*opcional|plaza.*opcional|posibilidad.*garaje/i.test(searchLower);

  // --- Renovación ---
  const hasFullRenovation = /reforma\s+integral|reforma\s+total|totalmente\s+reformad/i.test(searchLower);
  const hasAnyRenovation = /a\s+reformar|para\s+reformar|necesita\s+reforma/i.test(searchLower);
  const needsRenovation = hasFullRenovation
    ? ('total' as const)
    : hasAnyRenovation
      ? ('partial' as const)
      : ('no' as const);

  // --- Días publicado ---
  let daysPublished = 0;
  const dateMatch = fullText.match(/[Aa]nuncio\s+actualizado\s+(?:el)?\s*:?\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (dateMatch) {
    const updated = new Date(parseInt(dateMatch[3], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[1], 10));
    if (!isNaN(updated.getTime())) {
      daysPublished = Math.max(0, Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // --- Coordenadas (JSON-LD Place) ---
  let latitude: number | undefined;
  let longitude: number | undefined;
  const geo = placeLd?.geo as Record<string, string> | undefined;
  if (geo) {
    const lat = parseFloat(geo.latitude);
    const lng = parseFloat(geo.longitude);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) latitude = lat;
    if (!isNaN(lng) && lng >= -180 && lng <= 180) longitude = lng;
  }

  // --- Fotos ---
  const photos: string[] = [];
  const seenPhotos = new Set<string>();

  // Imágenes de inmotek (galería con clase web-gallery-item)
  doc.querySelectorAll('a.web-gallery-item img, img').forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    if (!src.includes('inmotek.net')) return;
    // Excluir logos
    if (/logo|favicon|icon/i.test(src)) return;

    // Normalizar: añadir protocolo si falta
    let finalUrl = src;
    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;

    const dedupeKey = finalUrl.split('?')[0];
    if (seenPhotos.has(dedupeKey)) return;
    seenPhotos.add(dedupeKey);
    photos.push(finalUrl);
  });

  // Fallback: buscar URLs de inmotek en el HTML
  if (photos.length === 0) {
    const pattern = /(?:https?:)?\/\/img\.inmotek\.net\/media\/areizaga\/fotos\/inmuebles\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
    for (const match of html.matchAll(pattern)) {
      let imgUrl = match[0];
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      const key = imgUrl.split('?')[0];
      if (!seenPhotos.has(key)) {
        seenPhotos.add(key);
        photos.push(imgUrl);
      }
    }
  }

  // --- Contacto ---
  let contactPhone = '';
  let contactPhone2 = '';
  const contactAgency = (agentLd?.name as string)?.replace(/\|.*/, '').trim() || 'Areizaga Inmobiliaria';
  const contactEmail = (agentLd?.email as string) || '';

  doc.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    const phone = link.getAttribute('href')?.replace('tel:', '').replace(/\s/g, '') || '';
    if (phone && phone.length >= 9) {
      if (!contactPhone) {
        contactPhone = phone;
      } else if (!contactPhone2 && phone !== contactPhone) {
        contactPhone2 = phone;
      }
    }
  });

  const result: Partial<Property> = {
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
      phone2: contactPhone2 || undefined,
      email: contactEmail,
      name: '',
      agency: contactAgency,
    },
    status: 'pending',
    notes: (() => {
      // Descripción desde JSON-LD o contenido WordPress
      const ldDesc = (placeLd?.description as string) || '';
      if (ldDesc.length > 30) return ldDesc.trim();
      const descEl = doc.querySelector('.entry-content p, .post-content p, .web-description p, .web-description');
      if (descEl) {
        const t = descEl.textContent?.trim() || '';
        if (t.length > 30) return t;
      }
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
      return ogDesc || '';
    })(),
  };

  return result;
};
