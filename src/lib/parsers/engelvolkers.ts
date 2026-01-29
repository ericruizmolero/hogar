/**
 * Parser para Engel & Völkers.
 *
 * Fuente principal: __NEXT_DATA__ (Next.js) → dehydratedState → listing query.
 * Contiene TODOS los datos de la propiedad: precio, superficie, habitaciones,
 * baños, planta, año, coordenadas, contacto, y las 54+ fotos en propertyImages.
 *
 * Fallback: JSON-LD (Product + RealEstateListing) + regex sobre el HTML.
 */

import type { Property, RenovationType } from '../../types';
import type { PlatformParser } from './types';

/* ------------------------------------------------------------------ */
/*  Tipos para __NEXT_DATA__                                          */
/* ------------------------------------------------------------------ */

interface EvMinMax {
  max?: number;
  min?: number;
}

interface EvArea {
  usableSurface?: EvMinMax;
  totalSurface?: EvMinMax;
  livingSurface?: EvMinMax;
}

interface EvPrice {
  salesPrice?: EvMinMax;
  rentTotal?: EvMinMax;
}

interface EvImage {
  id: string;
  main?: boolean;
  position?: number;
  type?: string; // "image" | "floor_plan"
  altText?: string;
}

interface EvAgent {
  name?: string;
  email?: string;
}

interface EvListing {
  propertyImages?: EvImage[];
  floorPlanImages?: EvImage[];
  uploadCareImageIds?: string[];
  area?: EvArea;
  price?: EvPrice;
  basePrice?: EvPrice;
  rooms?: EvMinMax;
  bedrooms?: EvMinMax;
  bathrooms?: EvMinMax;
  floor?: EvMinMax;
  constructionYear?: EvMinMax;
  condition?: string;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasGarden?: boolean;
  hasPatio?: boolean;
  hasBasement?: boolean;
  hasBuiltInKitchen?: boolean;
  hasSecuritySystem?: boolean;
  hasGuestToilet?: boolean;
  hasDoorman?: boolean;
  hasOpenView?: boolean;
  hasGreenView?: boolean;
  displayLat?: number;
  displayLng?: number;
  publishedAt?: string;
  updatedAt?: string;
  shopName?: string;
  officeName?: string;
  shopPhoneNumber?: string;
  shopEmail?: string;
  agent?: EvAgent;
  shopProfilePicture?: string;
  features?: string[];
  heatingType?: string;
  flooring?: string;
  propertyType?: string;
  propertySubType?: string;
}

/* ------------------------------------------------------------------ */
/*  Extracción de __NEXT_DATA__                                       */
/* ------------------------------------------------------------------ */

function extractNextData(doc: Document, html: string): EvListing | null {
  // Intentar desde el DOM
  const script = doc.querySelector('script#__NEXT_DATA__');
  const raw = script?.textContent || '';

  // Fallback: regex sobre HTML crudo
  const jsonStr =
    raw ||
    (html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '');

  if (!jsonStr) return null;

  try {
    const data = JSON.parse(jsonStr);
    const queries: Array<{ queryKey?: unknown[]; state?: { data?: { listing?: EvListing } } }> =
      data?.props?.pageProps?.dehydratedState?.queries ?? [];

    // Buscar la query cuyo key empieza por 'listing'
    for (const q of queries) {
      const key = q.queryKey;
      if (Array.isArray(key) && key[0] === 'listing') {
        return (q.state?.data?.listing as EvListing) ?? null;
      }
    }
  } catch {
    // JSON inválido
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Extracción de JSON-LD (fallback)                                  */
/* ------------------------------------------------------------------ */

function extractJsonLdBlocks(doc: Document, html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];

  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const d = JSON.parse(s.textContent || '');
      if (Array.isArray(d)) results.push(...d);
      else results.push(d);
    } catch { /* ignore */ }
  });

  if (results.length === 0) {
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1]);
        if (Array.isArray(d)) results.push(...d);
        else results.push(d);
      } catch { /* ignore */ }
    }
  }
  return results;
}

function findByType(blocks: Record<string, unknown>[], type: string) {
  return blocks.find((b) => {
    const t = b['@type'];
    if (typeof t === 'string') return t.toLowerCase().includes(type.toLowerCase());
    if (Array.isArray(t)) return t.some((s: string) => s.toLowerCase().includes(type.toLowerCase()));
    return false;
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Valor numérico de un campo min/max (prefiere max). */
const val = (mm?: EvMinMax): number => mm?.max ?? mm?.min ?? 0;

/** Construye URL de uploadcare con buena resolución. */
const uploadcareUrl = (uuid: string): string =>
  `https://uploadcare.engelvoelkers.com/${uuid}/-/resize/1200x/`;

/* ------------------------------------------------------------------ */
/*  Parser principal                                                   */
/* ------------------------------------------------------------------ */

export const parseEngelVolkersHtml: PlatformParser = (
  html: string,
  providedUrl: string,
): Partial<Property> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getText = (sel: string): string =>
    doc.querySelector(sel)?.textContent?.trim() || '';

  const getNumber = (text: string): number => {
    const m = text.match(/[\d.,]+/);
    return m ? parseFloat(m[0].replace(/\./g, '').replace(',', '.')) || 0 : 0;
  };

  // ========== Fuente principal: __NEXT_DATA__ ==========
  const listing = extractNextData(doc, html);

  // ========== Fallback: JSON-LD ==========
  const jsonLd = extractJsonLdBlocks(doc, html);
  const productLd = findByType(jsonLd, 'Product') as Record<string, unknown> | undefined;
  const realEstateLd = findByType(jsonLd, 'RealEstateListing') as Record<string, unknown> | undefined;
  const breadcrumbLd = findByType(jsonLd, 'BreadcrumbList') as Record<string, unknown> | undefined;

  const searchText = (doc.body?.textContent || html).toLowerCase();

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
    (productLd?.name as string) ||
    (realEstateLd?.name as string) ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    getText('h1') ||
    '';

  // --- Precio ---
  let price = 0;
  if (listing) {
    const sp = listing.price?.salesPrice || listing.basePrice?.salesPrice;
    price = val(sp);
  }
  if (!price) {
    const offers = productLd?.offers as Record<string, unknown> | undefined;
    if (offers?.price) price = Math.round(getNumber(String(offers.price)));
  }
  if (!price) {
    const pm = html.match(/"salesPrice"\s*:\s*\{[^}]*"max"\s*:\s*(\d+)/);
    if (pm) price = parseInt(pm[1], 10);
  }

  // --- Superficie ---
  let builtSquareMeters = 0;
  let usableSquareMeters = 0;

  if (listing?.area) {
    builtSquareMeters = val(listing.area.totalSurface);
    usableSquareMeters = val(listing.area.usableSurface) || val(listing.area.livingSurface);
  }
  if (!builtSquareMeters && !usableSquareMeters) {
    const sm = searchText.match(/(\d[\d.,]*)\s*m[²2]/);
    if (sm) {
      const v = getNumber(sm[1]);
      if (v > 10 && v < 10000) builtSquareMeters = v;
    }
  }
  const squareMeters = builtSquareMeters || usableSquareMeters;

  // --- Habitaciones / Baños / Planta ---
  let rooms = listing ? val(listing.bedrooms) || val(listing.rooms) : 0;
  let bathrooms = listing ? val(listing.bathrooms) : 0;
  let floor = listing?.floor ? String(val(listing.floor)) : '';

  if (!rooms) {
    const rm = searchText.match(/(\d+)\s*(?:habitaci|dormitorio|bedroom)/i);
    if (rm) rooms = parseInt(rm[1], 10) || 0;
  }
  if (!bathrooms) {
    const bm = searchText.match(/(\d+)\s*(?:baño|bathroom)/i);
    if (bm) bathrooms = parseInt(bm[1], 10) || 0;
  }

  // --- Año construcción ---
  let yearBuilt = listing ? val(listing.constructionYear) : 0;
  if (yearBuilt && (yearBuilt < 1800 || yearBuilt > 2030)) yearBuilt = 0;
  if (!yearBuilt) {
    const ym = searchText.match(/(?:construido|construcci[oó]n|built)\s*(?:en)?\s*[:\s]*(\d{4})/);
    if (ym) {
      const y = parseInt(ym[1], 10);
      if (y >= 1800 && y <= 2030) yearBuilt = y;
    }
  }

  // --- Zona / Dirección ---
  let zone = '';
  let address = '';

  if (listing?.shopName) {
    // shopName suele ser "Engel & Völkers San Sebastián MMC" → extraer la ciudad
    const cityMatch = listing.shopName.match(/Engel\s*&\s*Völkers\s+(.+?)(?:\s+MMC|\s+MC)?$/i);
    if (cityMatch) address = cityMatch[1].trim();
  }

  // Breadcrumbs del JSON-LD: España > Comunidad > Ciudad > Barrio
  const bcItems = breadcrumbLd?.itemListElement as Array<{ name?: string; position?: number }> | undefined;
  if (bcItems) {
    const sorted = [...bcItems]
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((i) => i.name || '')
      .filter(Boolean);
    if (sorted.length >= 2) {
      zone = sorted[sorted.length - 1];
      address = sorted.slice(1).join(', ');
    }
  }

  if (!zone) {
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    const md = ogDesc?.getAttribute('content') || '';
    const sm = md.match(/(?:calle|c\/|avenida|avda|plaza|paseo)\s+[^,.]+/i);
    if (sm) address = sm[0].trim();
  }

  // --- Características booleanas ---
  const terrace = listing?.hasTerrace ?? /\b(terraza|terrace)\b/i.test(searchText);
  const balcony = listing?.hasBalcony ?? /\b(balc[oó]n|balcony)\b/i.test(searchText);
  const elevator =
    listing?.hasDoorman !== undefined
      ? /\b(ascensor|elevator|lift)\b/i.test(searchText) && !/sin\s+ascensor/i.test(searchText)
      : /\b(ascensor|elevator|lift)\b/i.test(searchText) && !/sin\s+ascensor/i.test(searchText);
  const parkingIncluded = /garaje\s*incluid|parking\s*incluid|plaza.*incluid/i.test(searchText);
  const parkingOptional = /garaje\s*opcional|parking\s*opcional/i.test(searchText);

  // --- Orientación ---
  let orientation = '';
  const om = searchText.match(
    /orientaci[oó]n\s*[:\s]*(norte|sur|este|oeste|noroeste|noreste|suroeste|sureste)/i,
  );
  if (om) orientation = om[1].charAt(0).toUpperCase() + om[1].slice(1);

  // --- Renovación ---
  let needsRenovation: RenovationType = 'no';
  if (listing?.condition) {
    const cond = listing.condition.toLowerCase();
    if (cond.includes('renovate') || cond.includes('refurbish')) needsRenovation = 'total';
  }
  if (needsRenovation === 'no') {
    if (/reforma\s+integral|reforma\s+total|fully\s+renovated/i.test(searchText)) {
      needsRenovation = 'total';
    } else if (/a\s+reformar|para\s+reformar|necesita\s+reforma/i.test(searchText)) {
      needsRenovation = 'partial';
    }
  }

  // --- Días publicado ---
  let daysPublished = 0;
  const publishedDate = listing?.publishedAt || (realEstateLd?.datePosted as string | undefined);
  if (publishedDate) {
    const posted = new Date(publishedDate);
    if (!isNaN(posted.getTime())) {
      daysPublished = Math.max(0, Math.floor((Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // --- Coordenadas ---
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (listing?.displayLat && listing?.displayLng) {
    latitude = listing.displayLat;
    longitude = listing.displayLng;
  } else {
    const latM = html.match(/"displayLat"\s*:\s*([\d.-]+)/);
    const lngM = html.match(/"displayLng"\s*:\s*([\d.-]+)/);
    if (latM) { const v = parseFloat(latM[1]); if (v >= -90 && v <= 90) latitude = v; }
    if (lngM) { const v = parseFloat(lngM[1]); if (v >= -180 && v <= 180) longitude = v; }
  }

  // ======================== FOTOS ========================
  const photos: string[] = [];
  const seenUuids = new Set<string>();

  const addPhotoUuid = (uuid: string) => {
    if (!uuid || seenUuids.has(uuid)) return;
    seenUuids.add(uuid);
    photos.push(uploadcareUrl(uuid));
  };

  // 1) __NEXT_DATA__ → propertyImages (fuente fiable, incluye las 54+ fotos)
  if (listing?.propertyImages && listing.propertyImages.length > 0) {
    // Ordenar por position para mantener el orden de la galería
    const sorted = [...listing.propertyImages].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    for (const img of sorted) {
      if (img.type === 'image' || !img.type) {
        addPhotoUuid(img.id);
      }
    }
    // Añadir planos al final
    if (listing.floorPlanImages) {
      for (const fp of listing.floorPlanImages) {
        addPhotoUuid(fp.id);
      }
    }
  }

  // 2) Fallback: uploadCareImageIds (mismo dato en formato plano)
  if (photos.length === 0 && listing?.uploadCareImageIds) {
    for (const uuid of listing.uploadCareImageIds) {
      addPhotoUuid(uuid);
    }
  }

  // 3) Fallback: regex sobre HTML buscando el array uploadCareImageIds en crudo
  if (photos.length === 0) {
    const uuidArrayMatch = html.match(/"uploadCareImageIds"\s*:\s*\[([\s\S]*?)\]/);
    if (uuidArrayMatch) {
      const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
      for (const m of uuidArrayMatch[1].matchAll(uuidPattern)) {
        addPhotoUuid(m[0]);
      }
    }
  }

  // 4) Fallback: JSON-LD image + og:image
  if (photos.length === 0) {
    const ldImage = (productLd?.image || realEstateLd?.image) as string | string[] | undefined;
    if (ldImage) {
      const imgs = Array.isArray(ldImage) ? ldImage : [ldImage];
      for (const img of imgs) {
        const um = img.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (um) addPhotoUuid(um[1]);
      }
    }
    const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const ogUuid = ogImg.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (ogUuid) addPhotoUuid(ogUuid[1]);
  }

  // --- Contacto ---
  let contactPhone = listing?.shopPhoneNumber?.replace(/\s/g, '') || '';
  let contactEmail = listing?.shopEmail || '';
  let contactName = listing?.agent?.name || '';
  let contactAgency = listing?.shopName || 'Engel & Völkers';

  if (!contactPhone) {
    doc.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      const phone = link.getAttribute('href')?.replace('tel:', '').replace(/\s/g, '') || '';
      if (phone && phone.length >= 9 && !contactPhone) contactPhone = phone;
    });
  }
  if (!contactEmail) {
    if (listing?.agent?.email) contactEmail = listing.agent.email;
  }
  if (!contactAgency || contactAgency === 'Engel & Völkers') {
    const om = html.match(/engel\s*[&+]\s*v[öo]lkers\s+([^"'<]+?)(?:["|'|<])/i);
    if (om) contactAgency = `Engel & Völkers ${om[1].trim()}`;
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
      name: contactName,
      agency: contactAgency,
    },
    status: 'pending',
    notes: (() => {
      // Descripción desde JSON-LD o og:description
      const desc = (productLd?.description as string) || (realEstateLd?.description as string) || '';
      if (desc.length > 30) return desc.trim();
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
      return ogDesc || '';
    })(),
  };
};
